// =====================================================================
// master.controller.js — CONTROLLER master data
// =====================================================================

import * as service from "./master.service.js";
import { ValidationError } from "./master.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function getAll(req, res) {
  try {
    res.json(await service.getAll(req.params.entity));
  } catch (err) {
    handleError(res, err);
  }
}

export async function create(req, res) {
  try {
    res.status(201).json(await service.create(req.params.entity, req.body));
  } catch (err) {
    handleError(res, err);
  }
}

export async function update(req, res) {
  try {
    res.json(await service.update(req.params.entity, req.params.id, req.body));
  } catch (err) {
    handleError(res, err);
  }
}

export async function remove(req, res) {
  try {
    res.json(await service.remove(req.params.entity, req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}
