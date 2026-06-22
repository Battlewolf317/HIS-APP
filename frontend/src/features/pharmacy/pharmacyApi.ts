// =====================================================================
// pharmacyApi.ts — panggil API farmasi / dispensing (lewat apiFetch ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { PendingResep, DispenseRecord, DispenseInput } from "./types";

export function getPendingResep(): Promise<PendingResep[]> {
  return apiFetch("/pharmacy/resep");
}

export function getDispenseHistory(orderId: number): Promise<DispenseRecord[]> {
  return apiFetch(`/pharmacy/resep/${orderId}/dispense`);
}

export function dispense(data: DispenseInput): Promise<unknown> {
  return apiFetch("/pharmacy/dispense", { method: "POST", body: JSON.stringify(data) });
}
