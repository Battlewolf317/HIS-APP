// =====================================================================
// accounting.controller.js — CONTROLLER akuntansi (COA + jurnal)
// =====================================================================

import * as service from "./accounting.service.js";
import { ValidationError } from "./accounting.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

// GET /api/accounting/accounts
export async function accounts(req, res) {
  try {
    res.json(await service.listAkun());
  } catch (err) {
    handleError(res, err);
  }
}

// GET /api/accounting/journals?ref_tipe=
export async function journals(req, res) {
  try {
    res.json(await service.listJurnal({ ref_tipe: req.query.ref_tipe }));
  } catch (err) {
    handleError(res, err);
  }
}

// GET /api/accounting/trial-balance
export async function trialBalance(req, res) {
  try {
    res.json(await service.trialBalance());
  } catch (err) {
    handleError(res, err);
  }
}

// POST /api/accounting/journals  (jurnal manual) { tanggal?, keterangan, lines: [{akun_id, debit, kredit}] }
export async function postJournal(req, res) {
  try {
    res.status(201).json(await service.postJurnal({ ...req.body, ref_tipe: "MANUAL" }));
  } catch (err) {
    handleError(res, err);
  }
}
