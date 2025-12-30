import { validationResult } from "express-validator";
import {
  createDenunciaService,
  listDenunciasService,
  getDenunciaByIdService,
  updateDenunciaService,
  deleteDenunciaService,
  changeEstadoService,
} from "../services/denuncia.service.js";

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
      data: rows, // ✅ devolvemos directamente el resultado Prisma
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
    res.json(row); // ✅ sin mapDenunciaResponse
  } catch (err) {
    next(err);
  }
}
// 🆕 Crear una nueva denuncia (ACTUALIZADO CON DATOS PERSONALES Y GÉNERO)
export async function createDenuncia(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const e = new Error("Validación fallida");
      e.status = 400;
      e.details = errors.array();
      throw e;
    }

    const payload = {
      Rut: String(req.body.Rut),
      
      // --- NUEVOS CAMPOS PARA ACTUALIZAR PERSONA ---
      genero: req.body.genero, 
      nombreDenunciante: req.body.Nombre, // Ojo con el nombre del campo en tu frontend
      correoDenunciante: req.body.Correo,
      telefonoDenunciante: req.body.Telefono,
      regionDenunciante: req.body.regionDenunciante || null,
      comunaDenunciante: req.body.comunaDenunciante || null,
      direccionDenunciante: req.body.direccionDenunciante || null,
      // ---------------------------------------------

      ID_TipoDe: Number(req.body.ID_TipoDe),
      ID_EstadoDe: req.body.ID_EstadoDe ? Number(req.body.ID_EstadoDe) : undefined,
      Fecha_Inicio: req.body.Fecha_Inicio, // Se parseará en el servicio para evitar problemas de zona horaria
      Fecha_Fin: req.body.Fecha_Fin || null, // Fecha fin del rango (opcional, puede ser null)
      Relato_Hechos: String(req.body.Relato_Hechos),
      Ubicacion: req.body.Ubicacion ?? null,
      
      denunciados: Array.isArray(req.body.denunciados) ? req.body.denunciados : [],
      testigos: Array.isArray(req.body.testigos) ? req.body.testigos : [],
      evidencias: Array.isArray(req.body.evidencias) ? req.body.evidencias : [],
      victima: req.body.victima || undefined, // Datos de víctima externa si existe
      caracteristicasDenunciado: req.body.caracteristicasDenunciado ?? null,
    };

    const created = await createDenunciaService(payload, { historial: true });
    res.status(201).json(created);
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
      Fecha_Inicio: req.body.Fecha_Inicio ? new Date(req.body.Fecha_Inicio) : undefined,
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
      data: updated,
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
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
