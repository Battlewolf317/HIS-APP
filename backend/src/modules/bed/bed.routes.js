// =====================================================================
// bed.routes.js — endpoint bed management (Rawat Inap)
//  Aksi (assign/release/transfer/maintenance) dibatasi role perawat (admin auto).
// =====================================================================

import { Router } from "express";
import * as controller from "./bed.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/board", controller.getBoard);                          // bed board
router.get("/admittable", controller.getAdmittable);                // encounter RI AKTIF belum punya bed
router.post("/:id/assign", authorize("perawat"), controller.assign);        // tempatkan pasien
router.post("/:id/release", authorize("perawat"), controller.release);      // keluarkan pasien
router.post("/:id/transfer", authorize("perawat"), controller.transfer);    // pindah bed
router.post("/:id/maintenance", authorize("perawat"), controller.maintenance);

export default router;
