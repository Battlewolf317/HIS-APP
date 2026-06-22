// =====================================================================
// laporan.routes.js — endpoint laporan resmi RS (read-only)
// =====================================================================

import { Router } from "express";
import * as controller from "./laporan.controller.js";

const router = Router();

router.get("/sensus", controller.sensus);        // ?tanggal=YYYY-MM-DD
router.get("/indikator", controller.indikator);  // ?from=&to=  → BOR/ALOS/TOI/BTO
router.get("/kunjungan", controller.kunjungan);   // ?from=&to=  → statistik kunjungan

export default router;
