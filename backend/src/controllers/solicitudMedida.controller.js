import { validationResult } from "express-validator";

import { createSolicitudService, listPendientesDirgegenService } from "../services/solicitudMedida.service.js";

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

// 🆕 Crear Solicitud de Medida (Iniciada por la Víctima)
export async function createSolicitud(req, res, next) {
    try {
        // handleValidation(req); 

        // Asumimos que el ID de la víctima viene del token (ver auth.controller login)
        const idSolicitante = req.user.id;

        // Validación de seguridad básica si faltara el ID
        if (!idSolicitante) {
            return res.status(401).json({ message: "Usuario no identificado (Falta ID en token)" });
        }

        const payload = {
            idDenuncia: req.body.ID_Denuncia,
            idSolicitante: idSolicitante,
            tipoMedida: req.body.Tipo_Medida, // ej: 'Separación Espacios'
            observacion: req.body.Observacion ?? null,
        };

        const created = await createSolicitudService(payload);

        // Aquí iría la lógica de notificación a DIRGEGEN
        console.log(`[NOTIFICACIÓN EMAIL] Nueva Solicitud N°${created.ID_Solicitud} de medida de resguardo. La víctima ha sido notificada.`);

        res.status(201).json({
            message: "Solicitud de medida de resguardo registrada. DIRGEGEN ha sido notificada para la elaboración del informe técnico.",
            data: created,
        });

    } catch (err) {
        next(err);
    }
}

// 📋 Listar Pendientes de Informe (Bandeja de DIRGEGEN)
export async function listPendientesDirgegen(req, res, next) {
    try {
        // En un sistema real, antes de esto se verifica que el usuario sea DIRGEGEN
        const rows = await listPendientesDirgegenService();
        res.json(rows);
    } catch (err) {
        next(err);
    }
}