// =====================================================================
// queueApi.ts — panggil API antrian ber-auth
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { QueueItem, Queueable } from "./types";

export function getBoard(): Promise<QueueItem[]> {
  return apiFetch("/queue/board");
}

export function getQueueable(): Promise<Queueable[]> {
  return apiFetch("/queue/queueable");
}

export function takeQueue(encounterId: number): Promise<QueueItem> {
  return apiFetch("/queue/take", { method: "POST", body: JSON.stringify({ encounter_id: encounterId }) });
}

export function callQueue(id: number): Promise<QueueItem> {
  return apiFetch(`/queue/${id}/call`, { method: "PATCH" });
}

export function doneQueue(id: number): Promise<QueueItem> {
  return apiFetch(`/queue/${id}/done`, { method: "PATCH" });
}
