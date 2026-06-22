// =====================================================================
// patient.controller.js — LAPISAN CONTROLLER
// Tugas: terima HTTP request, panggil service, balikin response.
// Tangani error: ValidationError → 400, lainnya → 500.
// (Mirip "resepsionis": atur tamu, ga ngurus aturan/data detail)
// =====================================================================

import * as service from "./patient.service.js";
import { ValidationError } from "./patient.service.js";

// helper: ubah error jadi response yang sesuai
function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });   // salah input/aturan
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function getAll(req, res) {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function getOne(req, res) {
  try {
    const data = await service.getById(req.params.id);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function create(req, res) {
  try {
    const data = await service.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function update(req, res) {
  try {
    const data = await service.update(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function remove(req, res) {
  try {
    await service.remove(req.params.id);
    res.json({ message: "Pasien di-cancel", id: Number(req.params.id) });
  } catch (err) {
    handleError(res, err);
  }
}
