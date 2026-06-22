// =====================================================================
// askepApi.ts — panggil API asuhan keperawatan (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Askep, AskepForm, AskepStatus } from "./types";

export function getAskep(): Promise<Askep[]> {
  return apiFetch("/askep");
}
export function createAskep(data: AskepForm): Promise<Askep> {
  return apiFetch("/askep", { method: "POST", body: JSON.stringify(data) });
}
export function updateAskep(id: number, data: AskepForm): Promise<Askep> {
  return apiFetch(`/askep/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export function setAskepStatus(id: number, status: AskepStatus): Promise<Askep> {
  return apiFetch(`/askep/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
