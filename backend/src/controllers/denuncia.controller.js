import { validationResult } from "express-validator";
import { createDenunciaService } from "../services/denuncia.service.js";
import { mapDenunciaResponse } from "../entity/denuncia.entity.js";

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

// Listar denuncias con filtros y paginación
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
      data: rows.map(mapDenunciaResponse),
    });
  } catch (err) {
    next(err);
  }
}

//esto puede ser distinto 

export async function getDenunciaById(req, res, next) {
  try {
    handleValidation(req);
    const row = await getDenunciaByIdService(req.params.id);
    if (!row) return res.status(404).json({ message: "Denuncia no encontrada" });
    res.json(mapDenunciaResponse(row));
  } catch (err) {
    next(err);
  }
}


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
      ID_TipoDe: Number(req.body.ID_TipoDe),
      ID_EstadoDe: req.body.ID_EstadoDe ? Number(req.body.ID_EstadoDe) : undefined,
      Fecha_Inicio: new Date(req.body.Fecha_Inicio),
      Relato_Hechos: String(req.body.Relato_Hechos),
      Ubicacion: req.body.Ubicacion ?? null,

      // esto son los opcionales 
      denunciados: Array.isArray(req.body.denunciados) ? req.body.denunciados : [],
      testigos: Array.isArray(req.body.testigos) ? req.body.testigos : [],
      evidencias: Array.isArray(req.body.evidencias) ? req.body.evidencias : [],
      caracteristicasDenunciado: req.body.caracteristicasDenunciado ?? null,
    };

    const created = await createDenunciaService(payload, { historial: true });
    res.status(201).json(mapDenunciaResponse(created));
  } catch (err) {
    next(err);
  }
}


// beste no lo e actualizado ya que tengo dudas de la hacer udpate de la denuncia
//y no esta actualizado igual qu el services 
export async function updateDenuncia(req, res, next) {
  try {
    handleValidation(req);
    const id = Number(req.params.id);
    const data = {};

    // Solo copiamos campos presentes
    if (req.body.Rut !== undefined) data.Rut = String(req.body.Rut).trim();
    if (req.body.ID_TipoDe !== undefined) data.ID_TipoDe = Number(req.body.ID_TipoDe);
    if (req.body.ID_EstadoDe !== undefined) data.ID_EstadoDe = Number(req.body.ID_EstadoDe);
    if (req.body.Fecha_Inicio !== undefined) data.Fecha_Inicio = new Date(req.body.Fecha_Inicio);
    if (req.body.Relato_Hechos !== undefined) data.Relato_Hechos = String(req.body.Relato_Hechos).trim();
    if (req.body.Ubicacion !== undefined) data.Ubicacion = req.body.Ubicacion ? String(req.body.Ubicacion).trim() : null;

    const updated = await updateDenunciaService(id, data);
    res.json(mapDenunciaResponse(updated));
  } catch (err) {
    next(err);
  }
}

export async function deleteDenuncia(req, res, next) {
  try {
    handleValidation(req);
    await deleteDenunciaService(req.params.id);
    res.json({ message: "Denuncia eliminada" });
  } catch (err) {
    next(err);
  }
}

//para que cada actualizacion se guarde el endpoint se usa iugla despues 
export async function changeEstado(req, res, next) {
  try {
    handleValidation(req);
    const id = Number(req.params.id);
    const nuevoEstadoId = Number(req.body.nuevoEstadoId);
    const fecha = req.body.fecha ?? null;

    const updated = await changeEstadoService(id, nuevoEstadoId, fecha);
    res.json(mapDenunciaResponse(updated));
  } catch (err) {
    next(err);
  }
}
