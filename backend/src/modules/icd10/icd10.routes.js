// =====================================================================
// icd10.routes.js — endpoint master ICD-10
// =====================================================================

import { Router } from "express";
import * as controller from "./icd10.controller.js";

const router = Router();

router.get("/", controller.getAll); // GET /api/icd10 (atau ?q=demam)

export default router;
