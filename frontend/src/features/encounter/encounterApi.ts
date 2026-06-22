// =====================================================================
// encounterApi.ts — fungsi panggil API modul Encounter (lewat apiFetch ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Encounter, EncounterInput } from "./types";

export function getEncounters(): Promise<Encounter[]> {
  return apiFetch("/encounters");
}

export function createEncounter(data: EncounterInput): Promise<Encounter> {
  return apiFetch("/encounters", { method: "POST", body: JSON.stringify(data) });
}

export function updateEncounter(id: number, data: EncounterInput): Promise<Encounter> {
  return apiFetch(`/encounters/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function selesaiEncounter(id: number): Promise<Encounter> {
  return apiFetch(`/encounters/${id}/selesai`, { method: "PATCH" });
}

export function deleteEncounter(id: number): Promise<void> {
  return apiFetch(`/encounters/${id}`, { method: "DELETE" });
}
