// =====================================================================
// medrec.routes.js — endpoint rekam medis
// =====================================================================

import { Router } from "express";
import * as controller from "./medrec.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.getByEncounter);   // GET    /api/medical-records?encounter_id=..
router.post("/", authorize("dokter"), controller.create);      // hanya dokter (+admin)
router.delete("/:id", authorize("dokter"), controller.remove); // hanya dokter (+admin)

export default router;
