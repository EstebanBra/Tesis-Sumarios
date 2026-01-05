import { validationResult } from "express-validator";
import crypto from 'crypto';
import {
  createDenunciaService,
  listDenunciasService,
  getDenunciaByIdService,
  updateDenunciaService,
  deleteDenunciaService,
  changeEstadoService,
} from "../services/denuncia.service.js";
import { serializeBigInt } from "../utils/json.utils.js";
import { getPresignedDownloadUrl, uploadFileToMinIO, generateUniqueFileName } from "../services/storage.service.js";
import { enviarCorreo } from "../config/email.config.js";

function handleValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(e => ({ field: e.path, msg: e.msg }));
    const err = new Error("Validación fallida");
    err.status = 400;
    err.details = formatted;
    throw err;
  }
}

// 📋 Listar denuncias con filtros y paginación
export async function listDenuncias(req, res, next) {
  try {
    handleValidation(req);

    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);
    const filters = {
      rut: req.query.rut,
      tipoId: req.query.tipoId ? Number(req.query.tipoId) : undefined,
      estadoId: req.query.estadoId ? Number(req.query.estadoId) : undefined,
      desde: req.query.desde,
      hasta: req.query.hasta,
    };

    const { total, rows, pages } = await listDenunciasService(filters, page, pageSize);

    // Mapear Carrera_Cargo a carreraCargo para consistencia con el frontend
    const rowsMapped = rows.map(row => {
      if (row.denunciante && row.denunciante.Carrera_Cargo !== undefined) {
        return {
          ...row,
          denunciante: {
            ...row.denunciante,
            carreraCargo: row.denunciante.Carrera_Cargo
          }
        };
      }
      return row;
    });

    res.json({
      meta: { total, page, pageSize, pages },
      data: serializeBigInt(rowsMapped), // Convertir BigInt a Number antes de serializar
    });
  } catch (err) {
    next(err);
  }
}

// 🔍 Obtener una denuncia por ID
export async function getDenunciaById(req, res, next) {
  try {
    handleValidation(req);
    const row = await getDenunciaByIdService(req.params.id);
    if (!row) return res.status(404).json({ message: "Denuncia no encontrada" });

    // Usar la relación directa archivos de la denuncia (filtrada automáticamente por ID_Denuncia)
    // Esto evita mezclar archivos de otras denuncias del mismo denunciante
    const archivos = row.archivos || [];

    // Generar URLs presigned para cada archivo con MinIO_Key
    const archivosConUrls = await Promise.all(
      archivos.map(async (archivo) => {
        if (archivo.MinIO_Key) {
          try {
            const downloadUrl = await getPresignedDownloadUrl(archivo.MinIO_Key, 3600); // 1 hora de validez
            return {
              ...archivo,
              Ruta_Archivo: downloadUrl, // Mantener compatibilidad con código legacy
              downloadUrl: downloadUrl, // Nueva propiedad con nombre más claro
            };
          } catch (error) {
            console.error(`Error generando URL presigned para ${archivo.MinIO_Key}:`, error);
            return {
              ...archivo,
              Ruta_Archivo: null,
              downloadUrl: null,
            };
          }
        }
        return archivo;
      })
    );

    // Agregar archivos como campo plano para facilitar el acceso en el frontend
    const denunciaConArchivos = {
      ...row,
      archivos_denuncia: archivosConUrls,
    };

    // Mapear Carrera_Cargo a carreraCargo para consistencia con el frontend
    if (denunciaConArchivos.denunciante && denunciaConArchivos.denunciante.Carrera_Cargo !== undefined) {
      denunciaConArchivos.denunciante.carreraCargo = denunciaConArchivos.denunciante.Carrera_Cargo;
    }

    // Convertir BigInt a Number antes de serializar
    res.json(serializeBigInt(denunciaConArchivos));
  } catch (err) {
    next(err);
  }
}
// 🆕 Crear una nueva denuncia (ACTUALIZADO CON DATOS PERSONALES Y GÉNERO)
// Ahora también maneja archivos adjuntos que se suben a MinIO
export async function createDenuncia(req, res, next) {
  try {
    // Verificar que el RUT del denunciante coincida con el token temporal (solo para denuncias públicas)
    if (req.denuncianteVerificado) {
      const rutDenunciante = req.body.Rut;

      // Limpiar ambos RUTs para comparar (sin puntos, guión ni dígito verificador)
      const limpiarRut = (rut) => {
        if (!rut) return '';
        const rutOriginal = String(rut);
        // Remover puntos y convertir a string
        let limpio = rutOriginal.replace(/\./g, '').trim().toUpperCase();

        // Solo remover el último carácter si:
        // 1. El RUT original tenía guión (formato con DV: "12345678-9")
        // 2. O el último carácter es 'K' (DV especial)
        const tieneGuion = rutOriginal.includes('-');
        const ultimoChar = limpio[limpio.length - 1];

        // Primero remover el guión si existe
        limpio = limpio.replace(/-/g, '');

        // Luego remover DV solo si el RUT original tenía guión o termina en K
        if (tieneGuion || ultimoChar === 'K') {
          limpio = limpio.slice(0, -1);
        }

        return limpio;
      };

      const rutPayloadLimpio = limpiarRut(rutDenunciante);
      const rutTokenLimpio = limpiarRut(req.denuncianteVerificado.rut);

      console.log('🔍 DEBUG - Comparación RUTs:', {
        payloadOriginal: rutDenunciante,
        payloadLimpio: rutPayloadLimpio,
        tokenOriginal: req.denuncianteVerificado.rut,
        tokenLimpio: rutTokenLimpio
      });

      if (rutPayloadLimpio !== rutTokenLimpio) {
        console.log('❌ RUT mismatch:', { payload: rutPayloadLimpio, token: rutTokenLimpio });
        return res.status(403).json({
          message: 'El RUT no coincide con el usuario verificado'
        });
      }

      console.log('✅ RUT verificado correctamente:', rutPayloadLimpio);
    }

    // Los datos ya fueron parseados por el middleware parseFormDataJson
    // y validados por createDenunciaRules, así que req.body ya tiene los datos correctos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const e = new Error("Validación fallida");
      e.status = 400;
      e.details = errors.array();
      throw e;
    }

    // Usar req.body directamente (ya parseado)
    const bodyData = req.body;

    // Procesar archivos adjuntos si existen
    const archivos = req.files || [];
    const evidencias = [];

    // Subir cada archivo a MinIO y preparar metadatos
    for (const archivo of archivos) {
      try {
        // Generar nombre único para el archivo
        const uniqueFileName = generateUniqueFileName(archivo.originalname);

        // Subir archivo a MinIO
        await uploadFileToMinIO(archivo.buffer, uniqueFileName, archivo.mimetype);

        // Agregar a evidencias con metadatos
        evidencias.push({
          nombreArchivo: uniqueFileName, // MinIO object key
          nombreOriginal: archivo.originalname,
          tipoArchivo: archivo.mimetype,
          tamaño: archivo.size,
        });
      } catch (error) {
        console.error(`Error procesando archivo ${archivo.originalname}:`, error);
        // Continuar con otros archivos aunque uno falle
      }
    }

    // Generar token único para seguimiento público
    const tokenSeguimiento = crypto.randomUUID();

    const payload = {
      Rut: String(bodyData.Rut),

      // --- NUEVOS CAMPOS PARA ACTUALIZAR PERSONA ---
      sexo: bodyData.sexo || null,
      genero: bodyData.genero || null,
      nombreDenunciante: bodyData.Nombre, // Ojo con el nombre del campo en tu frontend
      correoDenunciante: bodyData.Correo,
      telefonoDenunciante: bodyData.Telefono,
      regionDenunciante: bodyData.regionDenunciante || null,
      comunaDenunciante: bodyData.comunaDenunciante || null,
      direccionDenunciante: bodyData.direccionDenunciante || null,
      carreraCargo: bodyData.carreraCargo || null, // Carrera o Cargo del denunciante
      // ---------------------------------------------

      ID_TipoDe: Number(bodyData.ID_TipoDe),
      ID_EstadoDe: bodyData.ID_EstadoDe ? Number(bodyData.ID_EstadoDe) : undefined,
      Fecha_Inicio: bodyData.Fecha_Inicio, // Se parseará en el servicio para evitar problemas de zona horaria
      Fecha_Fin: bodyData.Fecha_Fin || null, // Fecha fin del rango (opcional, puede ser null)
      Relato_Hechos: String(bodyData.Relato_Hechos),
      Ubicacion: bodyData.Ubicacion ?? null,
      reservaIdentidad: bodyData.reservaIdentidad ?? false, // Reserva de identidad
      tokenSeguimiento: tokenSeguimiento, // UUID para seguimiento

      denunciados: Array.isArray(bodyData.denunciados) ? bodyData.denunciados : [],
      testigos: Array.isArray(bodyData.testigos) ? bodyData.testigos : [],
      evidencias: evidencias, // Archivos subidos a MinIO
      victima: bodyData.victima || undefined, // Datos de víctima externa si existe
      caracteristicasDenunciado: bodyData.caracteristicasDenunciado ?? null,

      // Datos específicos para denuncias de campo clínico
      detalleCampoClinico: bodyData.detalleCampoClinico || null, // { nombreEstablecimiento, unidadServicio, tipoVinculacionDenunciado }
    };

    const created = await createDenunciaService(payload, { historial: true });

    // Generar link de seguimiento para enviar por email
    const linkSeguimiento = `${process.env.FRONTEND_URL || 'http://localhost'}/denuncia/seguimiento/${tokenSeguimiento}`;

    // Si es una denuncia pública (con token temporal), enviar email al denunciante con el link de seguimiento
    if (req.denuncianteVerificado && bodyData.Correo) {
      try {
        await enviarCorreo({
          to: bodyData.Correo,
          subject: 'Confirmación de Denuncia - Link de Seguimiento',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #003DA5; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Universidad del Bío-Bío</h1>
                <p style="color: white; margin: 5px 0 0 0;">Sistema de Denuncias</p>
              </div>

              <div style="padding: 30px; background-color: #f9f9f9;">
                <h2 style="color: #333;">¡Tu denuncia ha sido registrada exitosamente!</h2>

                <p style="color: #666; line-height: 1.6;">
                  Hemos recibido tu denuncia y ha sido ingresada al sistema correctamente.
                  Podrás dar seguimiento al estado de tu denuncia usando el siguiente enlace:
                </p>

                <div style="background-color: white; border: 2px solid #003DA5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">Link de Seguimiento:</p>
                  <a href="${linkSeguimiento}" style="color: #003DA5; word-break: break-all;">${linkSeguimiento}</a>
                </div>

                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong></p>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #856404;">
                    <li>Guarda este correo en un lugar seguro</li>
                    <li>Necesitarás el enlace para consultar el estado de tu denuncia</li>
                    <li>No compartas este enlace con personas no autorizadas</li>
                  </ul>
                </div>

                <p style="color: #666; line-height: 1.6;">
                  Si tienes alguna consulta o necesitas más información, puedes contactarnos.
                </p>

                <p style="color: #666; margin-top: 30px;">
                  Saludos cordiales,<br>
                  <strong>Sistema de Denuncias UBB</strong>
                </p>
              </div>

              <div style="background-color: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 0;">Este es un correo automático, por favor no responder.</p>
              </div>
            </div>
          `
        });
        console.log(`✅ Email de seguimiento enviado a: ${bodyData.Correo}`);
      } catch (emailError) {
        console.error('❌ Error al enviar email de seguimiento:', emailError);
        // No fallar la petición si falla el email
      }
    }

    res.status(201).json({
      ...serializeBigInt(created),
      linkSeguimiento: linkSeguimiento,
      tokenSeguimiento: tokenSeguimiento,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDenuncia(req, res, next) {
  try {
    handleValidation(req);
    const id = Number(req.params.id);

    const data = {
      Rut: req.body.Rut ? String(req.body.Rut).trim() : undefined,
      ID_TipoDe: req.body.nuevoTipoId ? Number(req.body.nuevoTipoId) : (req.body.ID_TipoDe ? Number(req.body.ID_TipoDe) : undefined),
      ID_EstadoDe: req.body.nuevoEstadoId ? Number(req.body.nuevoEstadoId) : (req.body.ID_EstadoDe ? Number(req.body.ID_EstadoDe) : undefined),
      Fecha_Inicio: req.body.Fecha_Inicio, // Se parseará en el servicio para evitar problemas de zona horaria
      Fecha_Fin: req.body.Fecha_Fin || null, // Fecha fin del rango (opcional)
      Relato_Hechos: req.body.Relato_Hechos ? String(req.body.Relato_Hechos).trim() : undefined,
      Ubicacion: req.body.Ubicacion ?? undefined,
      observacion: req.body.observacion ?? undefined,
      denunciados: Array.isArray(req.body.denunciados) ? req.body.denunciados : undefined,
      testigos: Array.isArray(req.body.testigos) ? req.body.testigos : undefined,
      evidencias: Array.isArray(req.body.evidencias) ? req.body.evidencias : undefined,
      caracteristicasDenunciado: req.body.caracteristicasDenunciado ?? undefined,
    };

    const updated = await updateDenunciaService(id, data);

    res.json({
      message: "Denuncia actualizada correctamente",
      data: serializeBigInt(updated),
    });
  } catch (err) {
    next(err);
  }
}


// 🗑️ Eliminar una denuncia
export async function deleteDenuncia(req, res, next) {
  try {
    handleValidation(req);
    await deleteDenunciaService(req.params.id);
    res.json({ message: "Denuncia eliminada" });
  } catch (err) {
    next(err);
  }
}

// 🔄 Cambiar estado de una denuncia
export async function changeEstado(req, res, next) {
  try {
    handleValidation(req);
    const id = Number(req.params.id);
    const nuevoEstadoId = Number(req.body.nuevoEstadoId);
    const fecha = req.body.fecha ?? null;

    const updated = await changeEstadoService(id, nuevoEstadoId, fecha);
    res.json(serializeBigInt(updated));
  } catch (err) {
    next(err);
  }
}

// 📤 Subir evidencia a una denuncia existente
// Esta ruta usa el flujo de presigned URLs: genera URL, el frontend sube directamente a MinIO,
// y luego registra los metadatos en la BD usando el objectKey
export async function subirEvidenciaDenuncia(req, res, next) {
  try {
    const idDenuncia = Number(req.params.id);

    // Validar que la denuncia existe
    const denuncia = await getDenunciaByIdService(idDenuncia);
    if (!denuncia) {
      return res.status(404).json({ message: "Denuncia no encontrada" });
    }

    // El frontend debe enviar: { objectKey, nombreOriginal, tipoArchivo, tamaño }
    // después de haber subido el archivo a MinIO usando la presigned URL
    const { objectKey, nombreOriginal, tipoArchivo, tamaño } = req.body;

    if (!objectKey || !nombreOriginal) {
      return res.status(400).json({
        message: "Se requieren objectKey y nombreOriginal para registrar el archivo"
      });
    }

    const prisma = (await import("../config/prisma.js")).default;

    // Guardar metadatos en la base de datos
    const denunciante = await prisma.persona.findUnique({
      where: { ID: denuncia.ID_Denunciante },
    });

    if (!denunciante) {
      throw new Error('Denunciante no encontrado');
    }

    // Crear o obtener Participante_Caso
    let participanteCaso = await prisma.participante_Caso.findFirst({
      where: {
        ID_Persona: denunciante.ID,
        Tipo_PC: 'DENUNCIANTE',
      },
    });

    if (!participanteCaso) {
      participanteCaso = await prisma.participante_Caso.create({
        data: {
          ID_Persona: denunciante.ID,
          Tipo_PC: 'DENUNCIANTE',
        },
      });
    }

    // Crear hito para la evidencia
    const hito = await prisma.hitos.create({
      data: {
        ID_PC: participanteCaso.ID_PC,
        Nombre: 'Evidencia Adicional',
        Descripcion: `Archivo subido: ${nombreOriginal}`,
      },
    });

    // Crear registro de archivo
    const archivoRegistrado = await prisma.archivo.create({
      data: {
        ID_Hitos: hito.ID_Hitos,
        ID_Denuncia: idDenuncia,
        Archivo: objectKey, // Deprecated, mantener para compatibilidad
        MinIO_Key: objectKey,
        Nombre_Original: nombreOriginal,
        Tipo_Archivo: tipoArchivo || 'application/octet-stream',
        Tamaño: tamaño ? BigInt(tamaño) : null,
      },
    });

    res.status(201).json({
      message: "Evidencia registrada exitosamente",
      data: serializeBigInt(archivoRegistrado),
    });
  } catch (err) {
    next(err);
  }
}

// 🔍 Obtener denuncia por token UUID (seguimiento público)
export async function getDenunciaByToken(req, res, next) {
  try {
    const { token } = req.params;
    const prisma = (await import("../config/prisma.js")).default;

    const denuncia = await prisma.denuncia.findUnique({
      where: { token_seguimiento: token },
      include: {
        estado_denuncia: true,
        tipo_denuncia: true,
        archivos: true,
      },
    });

    if (!denuncia) {
      return res.status(404).json({ message: 'Denuncia no encontrada o token inválido' });
    }

    // Generar URLs presigned para archivos
    const archivosConUrls = await Promise.all(
      (denuncia.archivos || []).map(async (archivo) => {
        if (archivo.MinIO_Key) {
          try {
            const downloadUrl = await getPresignedDownloadUrl(archivo.MinIO_Key, 3600);
            return {
              ...archivo,
              downloadUrl: downloadUrl,
            };
          } catch (error) {
            console.error(`Error generando URL presigned para ${archivo.MinIO_Key}:`, error);
            return {
              ...archivo,
              downloadUrl: null,
            };
          }
        }
        return archivo;
      })
    );

    // Retornar solo información relevante para el denunciante (sin datos sensibles)
    res.json(serializeBigInt({
      ID_Denuncia: denuncia.ID_Denuncia,
      Fecha_Ingreso: denuncia.Fecha_Ingreso,
      Fecha_Inicio: denuncia.Fecha_Inicio,
      Fecha_Fin: denuncia.Fecha_Fin,
      estado: denuncia.estado_denuncia,
      tipo: denuncia.tipo_denuncia,
      Relato_Hechos: denuncia.Relato_Hechos,
      Ubicacion: denuncia.Ubicacion,
      archivos: archivosConUrls,
    }));
  } catch (err) {
    next(err);
  }
}
