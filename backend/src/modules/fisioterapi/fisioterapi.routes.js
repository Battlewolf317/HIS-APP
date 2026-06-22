// =====================================================================
// fisioterapi.routes.js — endpoint fisioterapi
// =====================================================================

import { Router } from "express";
import * as controller from "./fisioterapi.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.list);
router.post("/", authorize("perawat", "dokter"), controller.create);
router.put("/:id", authorize("perawat", "dokter"), controller.update);
router.patch("/:id/status", authorize("perawat", "dokter"), controller.setStatus);
router.patch("/:id/sesi", authorize("perawat", "dokter"), controller.addSesi);

export default router;
