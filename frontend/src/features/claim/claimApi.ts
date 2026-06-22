// =====================================================================
// claimApi.ts — panggil API klaim penjamin (lewat apiFetch ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Claim, Penjamin, Aging, ClaimInput } from "./types";

export function getPenjamin(): Promise<Penjamin[]> {
  return apiFetch("/claims/penjamin");
}

export function getClaims(status = "", penjaminId = ""): Promise<Claim[]> {
  const p = new URLSearchParams();
  if (status) p.set("status", status);
  if (penjaminId) p.set("penjamin_id", penjaminId);
  const qs = p.toString();
  return apiFetch(`/claims${qs ? `?${qs}` : ""}`);
}

export function getAging(): Promise<Aging> {
  return apiFetch("/claims/aging");
}

export function createClaim(data: ClaimInput): Promise<Claim> {
  return apiFetch("/claims", { method: "POST", body: JSON.stringify(data) });
}

export function submitClaim(id: number): Promise<Claim> {
  return apiFetch(`/claims/${id}/submit`, { method: "PATCH" });
}

export function approveClaim(id: number, jumlahSetuju?: number): Promise<Claim> {
  return apiFetch(`/claims/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ jumlah_setuju: jumlahSetuju }),
  });
}

export function payClaim(id: number): Promise<Claim> {
  return apiFetch(`/claims/${id}/pay`, { method: "PATCH" });
}

export function rejectClaim(id: number, alasan: string): Promise<Claim> {
  return apiFetch(`/claims/${id}/reject`, { method: "PATCH", body: JSON.stringify({ alasan }) });
}
