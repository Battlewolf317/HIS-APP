// =====================================================================
// diagnosticApi.ts — panggil API penunjang (Lab / Radiologi) ber-auth
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { DiagOrder } from "./types";

export function getWorklist(jenis: string): Promise<DiagOrder[]> {
  return apiFetch(`/diagnostic/worklist?jenis=${jenis}`);
}

export function getDone(jenis: string): Promise<DiagOrder[]> {
  return apiFetch(`/diagnostic/done?jenis=${jenis}`);
}

export function submitResult(orderId: number, hasil: string): Promise<unknown> {
  return apiFetch("/diagnostic/result", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId, hasil }),
  });
}
