// src/routes/index.js
import { Router } from "express";

import denunciaRouter from "./denuncias.routes.js";

const router = Router();



router.use("/denuncias", denunciaRouter);



export default router;
