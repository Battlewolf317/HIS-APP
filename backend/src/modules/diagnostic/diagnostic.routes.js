// =====================================================================
// diagnostic.routes.js — endpoint penunjang (Lab LIS / Radiologi RIS)
//  Input hasil dibatasi role lab / radiologi (admin selalu boleh).
// =====================================================================

import { Router } from "express";
import * as controller from "./diagnostic.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/worklist", controller.getWorklist);                 // ?jenis=LAB|RAD (PENDING)
router.get("/done", controller.getDone);                         // ?jenis=LAB|RAD (DONE)
router.post("/result", authorize("lab", "radiologi"), controller.submitResult); // input hasil

export default router;
