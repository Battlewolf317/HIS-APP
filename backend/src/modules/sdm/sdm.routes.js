// =====================================================================
// sdm.routes.js — endpoint SDM (pegawai + presensi)
//  Manajemen pegawai = admin. Presensi bisa diisi admin (HRD).
// =====================================================================

import { Router } from "express";
import * as controller from "./sdm.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

// pegawai
router.get("/pegawai", controller.listPegawai);
router.post("/pegawai", authorize("admin"), controller.createPegawai);
router.put("/pegawai/:id", authorize("admin"), controller.updatePegawai);

// presensi
router.get("/presensi", controller.listPresensi);                 // ?tanggal=YYYY-MM-DD
router.post("/presensi", authorize("admin"), controller.savePresensi);

export default router;
