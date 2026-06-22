// =====================================================================
// orderApi.ts — panggil API order/CPOE (lewat apiFetch ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { ClinicalOrder, OrderInput } from "./types";

export function getOrders(encounterId: number): Promise<ClinicalOrder[]> {
  return apiFetch(`/orders?encounter_id=${encounterId}`);
}

export function createOrder(data: OrderInput): Promise<ClinicalOrder> {
  return apiFetch("/orders", { method: "POST", body: JSON.stringify(data) });
}

export function selesaiOrder(id: number, hasil: string): Promise<ClinicalOrder> {
  return apiFetch(`/orders/${id}/selesai`, { method: "PATCH", body: JSON.stringify({ hasil }) });
}

export function batalOrder(id: number): Promise<ClinicalOrder> {
  return apiFetch(`/orders/${id}/batal`, { method: "PATCH" });
}
