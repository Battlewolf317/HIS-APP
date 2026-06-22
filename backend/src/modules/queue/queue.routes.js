// =====================================================================
// queue.routes.js — endpoint antrian
//  Aksi (take/call/done) dibatasi role perawat (admin auto).
// =====================================================================

import { Router } from "express";
import * as controller from "./queue.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/board", controller.getBoard);                       // papan antrian hari ini
router.get("/queueable", controller.getQueueable);               // encounter blm ambil antrian
router.post("/take", authorize("perawat"), controller.take);     // ambil nomor antrian
router.patch("/:id/call", authorize("perawat"), controller.call); // panggil
router.patch("/:id/done", authorize("perawat"), controller.done); // selesai

export default router;
