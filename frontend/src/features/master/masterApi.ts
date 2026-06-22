// =====================================================================
// masterApi.ts — CRUD generik master data (poli/dokter/tarif)
//  Endpoint backend: /api/master/:entity  (mutasi butuh role admin)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { MasterRow } from "./types";

export function getAll(entity: string): Promise<MasterRow[]> {
  return apiFetch(`/master/${entity}`);
}

export function createRow(entity: string, data: Record<string, unknown>): Promise<MasterRow> {
  return apiFetch(`/master/${entity}`, { method: "POST", body: JSON.stringify(data) });
}

export function updateRow(entity: string, id: number, data: Record<string, unknown>): Promise<MasterRow> {
  return apiFetch(`/master/${entity}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function removeRow(entity: string, id: number): Promise<{ id: number }> {
  return apiFetch(`/master/${entity}/${id}`, { method: "DELETE" });
}
