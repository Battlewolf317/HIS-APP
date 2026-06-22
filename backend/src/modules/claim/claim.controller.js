// =====================================================================
// claim.controller.js — CONTROLLER klaim penjamin
// =====================================================================

import * as service from "./claim.service.js";
import { ValidationError } from "./claim.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

// GET /api/claims/penjamin
export async function listPenjamin(req, res) {
  try {
    res.json(await service.listPenjamin());
  } catch (err) {
    handleError(res, err);
  }
}

// GET /api/claims?status=&penjamin_id=
export async function list(req, res) {
  try {
    res.json(await service.listClaims({ status: req.query.status, penjaminId: req.query.penjamin_id }));
  } catch (err) {
    handleError(res, err);
  }
}

// GET /api/claims/aging
export async function aging(req, res) {
  try {
    res.json(await service.aging());
  } catch (err) {
    handleError(res, err);
  }
}

// POST /api/claims
export async function create(req, res) {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (err) {
    handleError(res, err);
  }
}

// PATCH /api/claims/:id/submit
export async function submit(req, res) {
  try {
    res.json(await service.submit(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

// PATCH /api/claims/:id/approve  { jumlah_setuju? }
export async function approve(req, res) {
  try {
    res.json(await service.approve(req.params.id, req.body?.jumlah_setuju));
  } catch (err) {
    handleError(res, err);
  }
}

// PATCH /api/claims/:id/pay
export async function pay(req, res) {
  try {
    res.json(await service.pay(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

// PATCH /api/claims/:id/reject  { alasan }
export async function reject(req, res) {
  try {
    res.json(await service.reject(req.params.id, req.body?.alasan));
  } catch (err) {
    handleError(res, err);
  }
}
