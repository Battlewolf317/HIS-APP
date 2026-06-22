// =====================================================================
// cppt.controller.js — CONTROLLER CPPT
// =====================================================================

import * as service from "./cppt.service.js";
import { ValidationError } from "./cppt.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function list(req, res) {
  try { res.json(await service.list()); } catch (err) { handleError(res, err); }
}
export async function listByEncounter(req, res) {
  try { res.json(await service.listByEncounter(req.params.encounterId)); } catch (err) { handleError(res, err); }
}
export async function create(req, res) {
  try { res.status(201).json(await service.create(req.body.encounter_id, req.body)); } catch (err) { handleError(res, err); }
}
export async function remove(req, res) {
  try { await service.remove(req.params.id); res.json({ message: "Catatan dihapus", id: Number(req.params.id) }); } catch (err) { handleError(res, err); }
}
