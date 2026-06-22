// =====================================================================
// accountingApi.ts — panggil API akuntansi (lewat apiFetch ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Akun, Jurnal, TrialRow, ManualLine } from "./types";

export function getAccounts(): Promise<Akun[]> {
  return apiFetch("/accounting/accounts");
}

export function getJournals(refTipe = ""): Promise<Jurnal[]> {
  const qs = refTipe ? `?ref_tipe=${refTipe}` : "";
  return apiFetch(`/accounting/journals${qs}`);
}

export function getTrialBalance(): Promise<TrialRow[]> {
  return apiFetch("/accounting/trial-balance");
}

export function postJournal(data: {
  keterangan: string;
  tanggal?: string;
  lines: ManualLine[];
}): Promise<Jurnal> {
  return apiFetch("/accounting/journals", { method: "POST", body: JSON.stringify(data) });
}
