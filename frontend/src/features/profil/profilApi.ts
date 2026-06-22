// =====================================================================
// profilApi.ts — panggil API profil pasien (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { PatientProfile } from "./types";

export function getProfile(patientId: number): Promise<PatientProfile> {
  return apiFetch(`/profil/${patientId}`);
}

export function getProfileByMrn(mrn: string): Promise<PatientProfile> {
  return apiFetch(`/profil/by-mrn/${encodeURIComponent(mrn)}`);
}
