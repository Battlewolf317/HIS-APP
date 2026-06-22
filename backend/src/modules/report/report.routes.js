// =====================================================================
// report.routes.js — endpoint Dashboard / Laporan (P9)
// =====================================================================

import { Router } from "express";
import * as controller from "./report.controller.js";

const router = Router();

router.get("/dashboard", controller.getDashboard);

export default router;
