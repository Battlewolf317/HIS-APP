// =====================================================================
// mcu.routes.js — endpoint Medical Check Up
// =====================================================================

import { Router } from "express";
import * as controller from "./mcu.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.list);
router.post("/", authorize("perawat", "dokter"), controller.create);
router.put("/:id", authorize("perawat", "dokter"), controller.update);
router.patch("/:id/status", authorize("perawat", "dokter"), controller.setStatus);

export default router;
