// =====================================================================
// diet.routes.js — endpoint diet pasien / nutrition
// =====================================================================

import { Router } from "express";
import * as controller from "./diet.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.list);                                          // GET    /api/diet
router.post("/", authorize("perawat", "dokter"), controller.create);       // tambah order diet
router.put("/:id", authorize("perawat", "dokter"), controller.update);     // ubah order diet
router.patch("/:id/status", authorize("perawat", "dokter"), controller.setStatus); // ubah status

export default router;
