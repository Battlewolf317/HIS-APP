// =====================================================================
// triase.controller.js — CONTROLLER triase IGD
// =====================================================================

import * as service from "./triase.service.js";
import { ValidationError } from "./triase.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

// GET /api/triase/worklist
export async function worklist(req, res) {
  try {
    res.json(await service.worklist());
  } catch (err) {
    handleError(res, err);
  }
}

// GET /api/triase/by-encounter/:encounterId
export async function getByEncounter(req, res) {
  try {
    res.json(await service.getByEncounter(req.params.encounterId));
  } catch (err) {
    handleError(res, err);
  }
}

// POST /api/triase/by-encounter/:encounterId
export async function save(req, res) {
  try {
    res.status(201).json(await service.save(req.params.encounterId, req.body));
  } catch (err) {
    handleError(res, err);
  }
}
