// =====================================================================
// discharge.controller.js — CONTROLLER ringkasan pulang / resep pulang
// =====================================================================

import * as service from "./discharge.service.js";
import { ValidationError } from "./discharge.service.js";

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

export async function getByEncounter(req, res) {
  try {
    res.json(await service.getByEncounter(req.params.encounterId));
  } catch (err) {
    handleError(res, err);
  }
}

export async function save(req, res) {
  try {
    res.status(201).json(await service.save(req.params.encounterId, req.body));
  } catch (err) {
    handleError(res, err);
  }
}
