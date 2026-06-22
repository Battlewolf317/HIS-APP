// =====================================================================
// cpptApi.ts — panggil API CPPT (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Cppt, CpptForm } from "./types";

export function getCppt(): Promise<Cppt[]> {
  return apiFetch("/cppt");
}
export function createCppt(data: CpptForm): Promise<Cppt> {
  return apiFetch("/cppt", { method: "POST", body: JSON.stringify(data) });
}
export function deleteCppt(id: number): Promise<unknown> {
  return apiFetch(`/cppt/${id}`, { method: "DELETE" });
}
