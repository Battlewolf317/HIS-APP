// =====================================================================
// discharge.routes.js — endpoint ringkasan pulang / resep pulang
// =====================================================================

import { Router } from "express";
import * as controller from "./discharge.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.list);                                                  // GET  /api/discharge
router.get("/by-encounter/:encounterId", controller.getByEncounter);               // GET  detail per kunjungan
router.post("/by-encounter/:encounterId", authorize("dokter"), controller.save);   // upsert (dokter +admin)

export default router;
