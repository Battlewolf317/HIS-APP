// =====================================================================
// operasi.routes.js — endpoint jadwal operasi (OT)
// =====================================================================

import { Router } from "express";
import * as controller from "./operasi.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.list);                                          // GET    /api/operasi
router.post("/", authorize("perawat", "dokter"), controller.create);       // jadwalkan operasi
router.put("/:id", authorize("perawat", "dokter"), controller.update);     // ubah jadwal
router.patch("/:id/status", authorize("perawat", "dokter"), controller.setStatus); // ubah status

export default router;
