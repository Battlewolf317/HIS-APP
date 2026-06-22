// =====================================================================
// pharmacy.service.js — BUSINESS LOGIC farmasi / dispensing
//  Alur: resep (order RESEP, PENDING) → farmasi dispense:
//    1. potong stok obat (inv_movement OUT, via inventory service)
//    2. order RESEP → DONE (via order service; auto masuk billing kalau ada harga)
//    3. catat jejak dispensing (pharmacy_dispense)
//  Menyambungkan modul Order + Inventory (rantai klinis).
// =====================================================================

import * as repo from "./pharmacy.repository.js";
import * as orderRepo from "../order/order.repository.js";
import * as orderService from "../order/order.service.js";
import * as invService from "../inventory/inventory.service.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export function getPendingResep() {
  return repo.findPendingResep();
}

export function getDispenseHistory(orderId) {
  if (!orderId) throw new ValidationError("order_id wajib diisi");
  return repo.findDispenseByOrder(orderId);
}

// Dispense 1 resep: potong stok + tutup order + catat jejak.
export async function dispense(data, user) {
  const orderId = Number(data.order_id);
  const itemId = Number(data.item_id);
  const qty = Number(data.qty);

  const order = await orderRepo.findById(orderId);
  if (!order) throw new ValidationError("Resep (order) tidak ditemukan");
  if (order.jenis !== "RESEP") throw new ValidationError("Order ini bukan resep (RESEP)");
  if (order.status !== "PENDING") throw new ValidationError("Resep sudah diproses / tidak PENDING");
  if (!itemId) throw new ValidationError("Item obat wajib dipilih");
  if (!(qty > 0)) throw new ValidationError("Qty dispense harus lebih dari 0");

  // 1) potong stok (OUT) — inventory service validasi stok cukup
  const movement = await invService.createMovement(
    {
      item_id: itemId,
      tipe: "OUT",
      qty,
      ref: `RESEP-${orderId}`,
      keterangan: `Dispensing resep order #${orderId}`,
    },
    user
  );

  // 2) order RESEP → DONE (auto-billing kalau harga > 0)
  await orderService.selesai(orderId, `Dispensed qty ${qty}`);

  // 3) catat jejak dispensing
  const dispense = await repo.insertDispense({
    order_id: orderId,
    item_id: itemId,
    qty,
    dispensed_by: user?.username || null,
  });

  return { dispense, movement };
}

export { ValidationError };
