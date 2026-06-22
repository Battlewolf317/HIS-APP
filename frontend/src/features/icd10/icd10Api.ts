// =====================================================================
// icd10Api.ts — panggil API master ICD-10 (lewat apiFetch ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Icd10 } from "./types";

// search by kode/nama (q kosong = semua)
export function searchIcd10(q = ""): Promise<Icd10[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch(`/icd10${qs}`);
}
