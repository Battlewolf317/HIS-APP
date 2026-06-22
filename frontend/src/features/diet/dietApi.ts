// =====================================================================
// dietApi.ts — panggil API diet pasien / nutrition (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Diet, DietForm, DietStatus } from "./types";

export function getDiets(): Promise<Diet[]> {
  return apiFetch("/diet");
}

export function createDiet(data: DietForm): Promise<Diet> {
  return apiFetch("/diet", { method: "POST", body: JSON.stringify(data) });
}

export function updateDiet(id: number, data: DietForm): Promise<Diet> {
  return apiFetch(`/diet/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function setDietStatus(id: number, status: DietStatus): Promise<Diet> {
  return apiFetch(`/diet/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
