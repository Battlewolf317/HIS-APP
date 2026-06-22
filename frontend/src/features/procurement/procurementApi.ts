// =====================================================================
// procurementApi.ts — panggil API pengadaan (PR/PO) ber-auth
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Purchase, Supplier, PurchaseForm } from "./types";

export function getSuppliers(): Promise<Supplier[]> {
  return apiFetch("/procurement/suppliers");
}

export function getPurchases(): Promise<Purchase[]> {
  return apiFetch("/procurement");
}

export function getPurchase(id: number): Promise<Purchase> {
  return apiFetch(`/procurement/${id}`);
}

export function createPurchase(data: PurchaseForm): Promise<Purchase> {
  return apiFetch("/procurement", { method: "POST", body: JSON.stringify(data) });
}

type Action = "submit" | "approve" | "receive" | "cancel";
export function purchaseAction(id: number, action: Action): Promise<Purchase> {
  return apiFetch(`/procurement/${id}/${action}`, { method: "PATCH" });
}
