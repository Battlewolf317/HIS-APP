// =====================================================================
// procurement.routes.js — endpoint pengadaan (PR/PO)
// =====================================================================

import { Router } from "express";
import * as controller from "./procurement.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/suppliers", controller.suppliers);                          // master supplier
router.get("/", controller.list);                                        // daftar dokumen
router.get("/:id", controller.detail);                                   // detail + lines
router.post("/", authorize("gudang"), controller.create);                // buat PR (gudang +admin)
router.patch("/:id/submit", authorize("gudang"), controller.submit);     // ajukan
router.patch("/:id/approve", authorize("admin"), controller.approve);    // setujui (admin)
router.patch("/:id/receive", authorize("gudang"), controller.receive);   // terima barang (stok masuk)
router.patch("/:id/cancel", authorize("gudang"), controller.cancel);     // batalkan

export default router;
