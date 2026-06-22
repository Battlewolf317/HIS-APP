// =====================================================================
// bill.controller.js — CONTROLLER tagihan
// =====================================================================

import * as service from "./bill.service.js";
import { ValidationError } from "./bill.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

// GET /api/bills?encounter_id=..  (auto-create kalau belum ada)
export async function getByEncounter(req, res) {
  try {
    res.json(await service.getByEncounter(req.query.encounter_id));
  } catch (err) {
    handleError(res, err);
  }
}

// POST /api/bills/:id/items
export async function addItem(req, res) {
  try {
    res.status(201).json(await service.addItem(req.params.id, req.body));
  } catch (err) {
    handleError(res, err);
  }
}

// DELETE /api/bills/items/:itemId
export async function removeItem(req, res) {
  try {
    res.json(await service.removeItem(req.params.itemId));
  } catch (err) {
    handleError(res, err);
  }
}

// PATCH /api/bills/:id/bayar
export async function bayar(req, res) {
  try {
    res.json(await service.bayar(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

// POST /api/bills/:id/payments  (kasir lanjutan: multi-metode/deposit/refund)
export async function addPayment(req, res) {
  try {
    const kasirNama = req.user?.nama || req.user?.username || null;
    res.status(201).json(await service.addPayment(req.params.id, req.body, kasirNama));
  } catch (err) {
    handleError(res, err);
  }
}
