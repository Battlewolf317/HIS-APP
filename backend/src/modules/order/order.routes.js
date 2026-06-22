// =====================================================================
// order.routes.js — endpoint order/CPOE
// =====================================================================

import { Router } from "express";
import * as controller from "./order.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.getByEncounter);                  // GET    /api/orders?encounter_id=..
router.post("/", authorize("dokter"), controller.create);     // buat order: dokter (+admin)
router.patch("/:id/selesai", controller.selesai);             // isi hasil/DONE: petugas lab/rad/farmasi
router.patch("/:id/batal", controller.batal);                 // batalkan order

export default router;
