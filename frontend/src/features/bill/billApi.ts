// =====================================================================
// billApi.ts — panggil API tagihan (lewat apiFetch ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Bill, PaymentInput } from "./types";

export function getBill(encounterId: number): Promise<Bill> {
  return apiFetch(`/bills?encounter_id=${encounterId}`);
}

export function addItem(
  billId: number,
  data: { deskripsi: string; qty: number; harga: number }
): Promise<Bill> {
  return apiFetch(`/bills/${billId}/items`, { method: "POST", body: JSON.stringify(data) });
}

export function removeItem(itemId: number): Promise<Bill> {
  return apiFetch(`/bills/items/${itemId}`, { method: "DELETE" });
}

export function bayar(billId: number): Promise<Bill> {
  return apiFetch(`/bills/${billId}/bayar`, { method: "PATCH" });
}

// P10 Kasir lanjutan — catat pembayaran (multi-metode / deposit / refund)
export function addPayment(billId: number, data: PaymentInput): Promise<Bill> {
  return apiFetch(`/bills/${billId}/payments`, { method: "POST", body: JSON.stringify(data) });
}
