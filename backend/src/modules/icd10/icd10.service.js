// =====================================================================
// icd10.service.js — BUSINESS LOGIC master ICD-10
// =====================================================================

import * as repo from "./icd10.repository.js";

export function getAll() {
  return repo.findAll();
}

// kalau ada query → search, kalau kosong → semua
export function list(q) {
  if (q && q.trim()) return repo.search(q.trim());
  return repo.findAll();
}

export function getByCode(code) {
  return repo.findByCode(code);
}
