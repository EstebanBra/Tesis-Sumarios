import { createSolicitudService, listPendientesDirgegenService } from "../services/solicitudMedida.service.js";

// Crear Solicitud de Medida
export async function createSolicitud(req, res, next) {
    try {
        // ID del usuario autenticado (víctima o denunciante)
        const idSolicitante = req.user.id;

        if (!idSolicitante) {
            return res.status(401).json({ message: "Usuario no identificado" });
        }

        // Preparamos el objeto para el servicio
        const payload = {
            idDenuncia: req.body.ID_Denuncia,
            idSolicitante: idSolicitante, // Pasamos el ID, no el RUT
            tipoMedida: req.body.Tipo_Medida,
            observacion: req.body.Observacion ?? null,
        };

        const created = await createSolicitudService(payload);

        // Mensaje dinámico según a dónde se fue la solicitud
        const destino = created.Estado === 'Pendiente Informe' ? 'DIRGEGEN' : 'la Autoridad Competente';

        res.status(201).json({
            message: `Solicitud enviada a ${destino}.`,
            data: created,
        });

    } catch (err) {
        next(err);
    }
}

// Listar Pendientes para DIRGEGEN
export async function listPendientesDirgegen(req, res, next) {
    try {
        const rows = await listPendientesDirgegenService();
        res.json(rows);
    } catch (err) {
        next(err);
    }
}