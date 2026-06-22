// =====================================================================
// asisten.routes.js — endpoint Asisten Klinis (hanya tenaga klinis)
// =====================================================================

import { Router } from "express";
import * as controller from "./asisten.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.post("/ask", authorize("dokter", "perawat"), controller.ask);

export default router;
