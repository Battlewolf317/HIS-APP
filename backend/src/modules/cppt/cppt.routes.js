// =====================================================================
// cppt.routes.js — endpoint CPPT (catatan terintegrasi)
// =====================================================================

import { Router } from "express";
import * as controller from "./cppt.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.list);
router.get("/by-encounter/:encounterId", controller.listByEncounter);
router.post("/", authorize("dokter", "perawat", "farmasi"), controller.create);
router.delete("/:id", authorize("dokter", "perawat"), controller.remove);

export default router;
