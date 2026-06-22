// =====================================================================
// dpjp.routes.js — endpoint DPJP
// =====================================================================

import { Router } from "express";
import * as controller from "./dpjp.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.list);                                          // GET    /api/dpjp
router.post("/", authorize("perawat", "dokter"), controller.create);       // tetapkan DPJP
router.put("/:id", authorize("perawat", "dokter"), controller.update);     // ubah DPJP
router.patch("/:id/status", authorize("perawat", "dokter"), controller.setStatus); // selesai/aktif

export default router;
