// =====================================================================
// medrec.controller.js — CONTROLLER rekam medis
// =====================================================================

import * as service from "./medrec.service.js";
import { ValidationError } from "./medrec.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

// GET /api/medical-records?encounter_id=...
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

export async function remove(req, res) {
  try {
    await service.remove(req.params.id);
    res.json({ message: "Rekam medis dihapus", id: Number(req.params.id) });
  } catch (err) {
    handleError(res, err);
  }
}
