// =====================================================================
// diet.controller.js — CONTROLLER diet pasien / nutrition
// =====================================================================

import * as service from "./diet.service.js";
import { ValidationError } from "./diet.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function list(req, res) {
  try {
    res.json(await service.list());
  } catch (err) {
    handleError(res, err);
  }
}

export async function create(req, res) {
  try {
    res.status(201).json(await service.create(req.body.encounter_id, req.body));
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

export async function setStatus(req, res) {
  try {
    res.json(await service.setStatus(req.params.id, req.body.status));
  } catch (err) {
    handleError(res, err);
  }
}
