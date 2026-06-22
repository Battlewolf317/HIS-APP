// =====================================================================
// laporan.controller.js — CONTROLLER laporan resmi RS
// =====================================================================

import * as service from "./laporan.service.js";
import { ValidationError } from "./laporan.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function sensus(req, res) {
  try {
    res.json(await service.getSensus(req.query.tanggal));
  } catch (err) {
    handleError(res, err);
  }
}

export async function indikator(req, res) {
  try {
    res.json(await service.getIndikator(req.query.from, req.query.to));
  } catch (err) {
    handleError(res, err);
  }
}

export async function kunjungan(req, res) {
  try {
    res.json(await service.getKunjungan(req.query.from, req.query.to));
  } catch (err) {
    handleError(res, err);
  }
}
