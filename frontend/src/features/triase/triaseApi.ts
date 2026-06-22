// =====================================================================
// triaseApi.ts — panggil API triase IGD (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { TriaseWorklistRow, TriaseDetail, TriaseForm } from "./types";

export function getWorklist(): Promise<TriaseWorklistRow[]> {
  return apiFetch("/triase/worklist");
}

export function getByEncounter(encounterId: number): Promise<TriaseDetail> {
  return apiFetch(`/triase/by-encounter/${encounterId}`);
}

export function save(encounterId: number, data: TriaseForm): Promise<unknown> {
  return apiFetch(`/triase/by-encounter/${encounterId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
