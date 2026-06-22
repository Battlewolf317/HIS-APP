// =====================================================================
// inventory.routes.js — endpoint inventory / gudang
//  Mutasi master & gerakan stok dibatasi role "gudang" (admin selalu boleh).
//  Pembacaan terbuka untuk semua user login.
// =====================================================================

import { Router } from "express";
import * as controller from "./inventory.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

// stok rendah (taruh sebelum /items/:id biar tidak bentrok)
router.get("/low-stock", controller.lowStock);

// master item
router.get("/items", controller.getItems);                       // ?q=&kategori=
router.get("/items/:id", controller.getItem);
router.post("/items", authorize("gudang"), controller.createItem);
router.put("/items/:id", authorize("gudang"), controller.updateItem);
router.delete("/items/:id", authorize("gudang"), controller.deleteItem);

// kartu stok per item
router.get("/items/:id/movements", controller.getMovements);

// catat gerakan stok (IN/OUT/ADJ)
router.post("/movements", authorize("gudang"), controller.createMovement);

export default router;
