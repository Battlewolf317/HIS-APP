// =====================================================================
// bill.routes.js — endpoint tagihan
// =====================================================================

import { Router } from "express";
import * as controller from "./bill.controller.js";
import { authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = Router();

const itemSchema = {
  deskripsi: { type: "string", required: true, maxLen: 200 },
  qty: { type: "int", required: true, min: 1 },
  harga: { type: "number", required: true, min: 0 },
};
const paymentSchema = {
  jenis: { type: "string", required: true, enum: ["BAYAR", "DEPOSIT", "REFUND"] },
  metode: { type: "string", required: true, enum: ["TUNAI", "DEBIT", "KREDIT", "TRANSFER", "BPJS", "ASURANSI"] },
  jumlah: { type: "number", required: true, min: 1 },
  keterangan: { type: "string", maxLen: 200 },
};

router.get("/", controller.getByEncounter);          // GET    /api/bills?encounter_id=..
router.post("/:id/items", validate(itemSchema), controller.addItem);        // POST   /api/bills/:id/items
router.delete("/items/:itemId", controller.removeItem); // DELETE /api/bills/items/:itemId
router.patch("/:id/bayar", authorize("kasir"), controller.bayar); // bayar: hanya kasir (+admin)
router.post("/:id/payments", authorize("kasir"), validate(paymentSchema), controller.addPayment); // kasir lanjutan

export default router;
