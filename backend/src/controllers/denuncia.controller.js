import { validationResult } from "express-validator";
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
    res.json({
      meta: { total, page, pageSize, pages },
      data: serializeBigInt(rows), // Convertir BigInt a Number antes de serializar
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

    const payload = {
      Rut: String(bodyData.Rut),
      
      // --- NUEVOS CAMPOS PARA ACTUALIZAR PERSONA ---
      genero: bodyData.genero, 
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
      
      denunciados: Array.isArray(bodyData.denunciados) ? bodyData.denunciados : [],
      testigos: Array.isArray(bodyData.testigos) ? bodyData.testigos : [],
      evidencias: evidencias, // Archivos subidos a MinIO
      victima: bodyData.victima || undefined, // Datos de víctima externa si existe
      caracteristicasDenunciado: bodyData.caracteristicasDenunciado ?? null,
      
      // Datos específicos para denuncias de campo clínico
      detalleCampoClinico: bodyData.detalleCampoClinico || null, // { nombreEstablecimiento, unidadServicio, tipoVinculacionDenunciado }
    };

    const created = await createDenunciaService(payload, { historial: true });
    res.status(201).json(serializeBigInt(created));
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
