// =====================================================================
// patientApi.ts — fungsi panggil API modul Patient (lewat apiFetch ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Patient, PatientInput } from "./types";

export function getPatients(): Promise<Patient[]> {
  return apiFetch("/patients");
}

export function createPatient(data: PatientInput): Promise<Patient> {
  return apiFetch("/patients", { method: "POST", body: JSON.stringify(data) });
}

export function updatePatient(id: number, data: PatientInput): Promise<Patient> {
  return apiFetch(`/patients/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deletePatient(id: number): Promise<void> {
  return apiFetch(`/patients/${id}`, { method: "DELETE" });
}
