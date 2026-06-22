// =====================================================================
// consentApi.ts — panggil API informed consent (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Consent, ConsentForm } from "./types";

export function getConsent(): Promise<Consent[]> {
  return apiFetch("/consent");
}
export function createConsent(data: ConsentForm): Promise<Consent> {
  return apiFetch("/consent", { method: "POST", body: JSON.stringify(data) });
}
export function updateConsent(id: number, data: ConsentForm): Promise<Consent> {
  return apiFetch(`/consent/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
