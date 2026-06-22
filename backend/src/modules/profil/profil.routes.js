// =====================================================================
// profil.routes.js — endpoint profil pasien (360° view, read-only)
// =====================================================================

import { Router } from "express";
import * as controller from "./profil.controller.js";

const router = Router();

router.get("/by-mrn/:mrn", controller.getProfileByMrn); // GET /api/profil/by-mrn/:mrn
router.get("/:patientId", controller.getProfile);  // GET /api/profil/:patientId

export default router;
