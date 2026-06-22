// =====================================================================
// rujukan.routes.js — endpoint rujukan (SISRUTE)
// =====================================================================

import { Router } from "express";
import * as controller from "./rujukan.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.list);                                          // GET    /api/rujukan
router.post("/", authorize("perawat", "dokter"), controller.create);       // tambah rujukan
router.put("/:id", authorize("perawat", "dokter"), controller.update);     // ubah rujukan
router.patch("/:id/status", authorize("perawat", "dokter"), controller.setStatus); // ubah status

export default router;
