// =====================================================================
// diagnostic.service.js — BUSINESS LOGIC penunjang (Lab LIS / Radiologi RIS)
//  Worklist order LAB/RAD → input hasil → order DONE (auto-billing via order service).
// =====================================================================

import * as repo from "./diagnostic.repository.js";
import * as orderService from "../order/order.service.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const JENIS_VALID = ["LAB", "RAD"];

function assertJenis(jenis) {
  if (!JENIS_VALID.includes(jenis)) throw new ValidationError("Jenis harus LAB atau RAD");
}

export function getWorklist(jenis) {
  assertJenis(jenis);
  return repo.findWorklist(jenis);
}

export function getDone(jenis) {
  assertJenis(jenis);
  return repo.findDone(jenis);
}

// Input hasil pemeriksaan → order DONE (auto-billing kalau ada harga)
export async function submitResult(orderId, hasil) {
  if (!orderId) throw new ValidationError("order_id wajib diisi");
  if (!hasil || !hasil.trim()) throw new ValidationError("Hasil pemeriksaan wajib diisi");
  return orderService.selesai(orderId, hasil);
}

export { ValidationError };
