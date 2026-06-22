// =====================================================================
// dischargeApi.ts — panggil API ringkasan pulang / resep pulang (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Discharge, DischargeForm } from "./types";

export function getDischarges(): Promise<Discharge[]> {
  return apiFetch("/discharge");
}

export function getByEncounter(encounterId: number): Promise<{ encounter: { id: number; encounter_no: string; tipe: string; patient_nama: string; patient_mrn: string }; discharge: Discharge | null }> {
  return apiFetch(`/discharge/by-encounter/${encounterId}`);
}

export function saveDischarge(encounterId: number, data: DischargeForm): Promise<Discharge> {
  return apiFetch(`/discharge/by-encounter/${encounterId}`, { method: "POST", body: JSON.stringify(data) });
}
