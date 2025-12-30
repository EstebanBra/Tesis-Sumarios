// src/routes/index.js
import { Router } from "express";
import denunciaRouter from "./denuncias.routes.js";
import gestionRoutes from "./dirgegen.routes.js";
import solicitudRoutes from "./solicitudMedida.routes.js";
import informeRoutes from "./informeTecnico.routes.js";
import notificacionesRoutes from "./notificaciones.routes.js";
import storageRoutes from "./storage.routes.js";

const router = Router();

router.use("/denuncias", denunciaRouter);
router.use("/gestion", gestionRoutes);
router.use("/solicitudes", solicitudRoutes);
router.use("/informes-tecnicos", informeRoutes);
router.use("/notificaciones", notificacionesRoutes);
router.use("/storage", storageRoutes);

export default router; 