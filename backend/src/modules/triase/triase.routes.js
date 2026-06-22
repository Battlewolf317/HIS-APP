// =====================================================================
// triase.routes.js — endpoint triase IGD
// =====================================================================

import { Router } from "express";
import * as controller from "./triase.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/worklist", controller.worklist);                                    // GET    /api/triase/worklist
router.get("/by-encounter/:encounterId", controller.getByEncounter);             // GET    /api/triase/by-encounter/:id
router.post("/by-encounter/:encounterId", authorize("perawat", "dokter"), controller.save); // perawat & dokter (+admin)

export default router;
