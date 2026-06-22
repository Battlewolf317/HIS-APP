// =====================================================================
// inventoryApi.ts — panggil API inventory / gudang (lewat apiFetch ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { InvItem, InvItemInput, InvMovement, MovementInput } from "./types";

export function getItems(q = "", kategori = ""): Promise<InvItem[]> {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (kategori) p.set("kategori", kategori);
  const qs = p.toString();
  return apiFetch(`/inventory/items${qs ? `?${qs}` : ""}`);
}

export function createItem(data: InvItemInput): Promise<InvItem> {
  return apiFetch("/inventory/items", { method: "POST", body: JSON.stringify(data) });
}

export function updateItem(id: number, data: InvItemInput): Promise<InvItem> {
  return apiFetch(`/inventory/items/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteItem(id: number): Promise<InvItem> {
  return apiFetch(`/inventory/items/${id}`, { method: "DELETE" });
}

export function getLowStock(): Promise<InvItem[]> {
  return apiFetch("/inventory/low-stock");
}

export function getMovements(itemId: number): Promise<InvMovement[]> {
  return apiFetch(`/inventory/items/${itemId}/movements`);
}

export function createMovement(data: MovementInput): Promise<InvMovement> {
  return apiFetch("/inventory/movements", { method: "POST", body: JSON.stringify(data) });
}
