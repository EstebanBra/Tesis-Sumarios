// src/routes/index.js
import { Router } from "express";
import denunciaRouter from "./denuncias.routes.js";
import gestionRoutes from "./dirgegen.routes.js";

const router = Router();

router.use("/denuncias", denunciaRouter);

router.use("/api/gestion", gestionRoutes);

export default router;
