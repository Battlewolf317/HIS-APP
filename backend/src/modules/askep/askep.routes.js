// =====================================================================
// askep.routes.js — endpoint asuhan keperawatan
// =====================================================================

import { Router } from "express";
import * as controller from "./askep.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.list);
router.post("/", authorize("perawat", "dokter"), controller.create);
router.put("/:id", authorize("perawat", "dokter"), controller.update);
router.patch("/:id/status", authorize("perawat", "dokter"), controller.setStatus);

export default router;
