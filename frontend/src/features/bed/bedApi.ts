// =====================================================================
// bedApi.ts — panggil API bed management (Rawat Inap) ber-auth
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Bed, Admittable } from "./types";

export function getBoard(): Promise<Bed[]> {
  return apiFetch("/beds/board");
}

export function getAdmittable(): Promise<Admittable[]> {
  return apiFetch("/beds/admittable");
}

export function assignBed(bedId: number, encounterId: number): Promise<Bed> {
  return apiFetch(`/beds/${bedId}/assign`, {
    method: "POST",
    body: JSON.stringify({ encounter_id: encounterId }),
  });
}

export function releaseBed(bedId: number): Promise<Bed> {
  return apiFetch(`/beds/${bedId}/release`, { method: "POST" });
}

export function transferBed(fromBedId: number, toBedId: number): Promise<Bed> {
  return apiFetch(`/beds/${fromBedId}/transfer`, {
    method: "POST",
    body: JSON.stringify({ to_bed_id: toBedId }),
  });
}

export function maintenanceBed(bedId: number, on: boolean): Promise<Bed> {
  return apiFetch(`/beds/${bedId}/maintenance`, {
    method: "POST",
    body: JSON.stringify({ on }),
  });
}
