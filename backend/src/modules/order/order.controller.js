// =====================================================================
// order.controller.js — CONTROLLER order/CPOE
// =====================================================================

import * as service from "./order.service.js";
import { ValidationError } from "./order.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function getByEncounter(req, res) {
  try {
    res.json(await service.getByEncounter(req.query.encounter_id));
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

// PATCH /:id/selesai  (body: { hasil })
export async function selesai(req, res) {
  try {
    res.json(await service.selesai(req.params.id, req.body.hasil));
  } catch (err) {
    handleError(res, err);
  }
}

export async function batal(req, res) {
  try {
    res.json(await service.batal(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}
