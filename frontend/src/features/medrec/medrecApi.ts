// =====================================================================
// medrecApi.ts — panggil API rekam medis (lewat apiFetch ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { MedicalRecord, MedicalRecordInput } from "./types";

export function getRecords(encounterId: number): Promise<MedicalRecord[]> {
  return apiFetch(`/medical-records?encounter_id=${encounterId}`);
}

export function createRecord(data: MedicalRecordInput): Promise<MedicalRecord> {
  return apiFetch("/medical-records", { method: "POST", body: JSON.stringify(data) });
}

export function deleteRecord(id: number): Promise<void> {
  return apiFetch(`/medical-records/${id}`, { method: "DELETE" });
}
