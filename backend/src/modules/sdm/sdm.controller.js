// =====================================================================
// sdm.controller.js — CONTROLLER SDM (pegawai + presensi)
// =====================================================================

import * as service from "./sdm.service.js";
import { ValidationError } from "./sdm.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

// ---------- PEGAWAI ----------
export async function listPegawai(req, res) {
  try {
    res.json(await service.listPegawai());
  } catch (err) {
    handleError(res, err);
  }
}

export async function createPegawai(req, res) {
  try {
    res.status(201).json(await service.createPegawai(req.body));
  } catch (err) {
    handleError(res, err);
  }
}

export async function updatePegawai(req, res) {
  try {
    res.json(await service.updatePegawai(req.params.id, req.body));
  } catch (err) {
    handleError(res, err);
  }
}

// ---------- PRESENSI ----------
export async function listPresensi(req, res) {
  try {
    res.json(await service.listPresensi(req.query.tanggal));
  } catch (err) {
    handleError(res, err);
  }
}

export async function savePresensi(req, res) {
  try {
    res.status(201).json(await service.savePresensi(req.body));
  } catch (err) {
    handleError(res, err);
  }
}
