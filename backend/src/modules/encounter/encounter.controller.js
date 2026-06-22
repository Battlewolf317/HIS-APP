// =====================================================================
// encounter.controller.js — LAPISAN CONTROLLER
// Tugas: terima HTTP request, panggil service, balikin response.
// Tangani error: ValidationError → 400, lainnya → 500.
// (Mirip "resepsionis": atur tamu, ga ngurus aturan/data detail)
// =====================================================================

import * as service from "./encounter.service.js";
import { ValidationError } from "./encounter.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function getAll(req, res) {
  try {
    res.json(await service.getAll());
  } catch (err) {
    handleError(res, err);
  }
}

export async function getOne(req, res) {
  try {
    res.json(await service.getById(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function create(req, res) {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (err) {
    handleError(res, err);
  }
}

export async function update(req, res) {
  try {
    res.json(await service.update(req.params.id, req.body));
  } catch (err) {
    handleError(res, err);
  }
}

// PATCH .../selesai — discharge kunjungan
export async function selesai(req, res) {
  try {
    res.json(await service.selesai(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function remove(req, res) {
  try {
    await service.remove(req.params.id);
    res.json({ message: "Kunjungan di-cancel", id: Number(req.params.id) });
  } catch (err) {
    handleError(res, err);
  }
}
