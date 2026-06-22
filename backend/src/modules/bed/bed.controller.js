// =====================================================================
// bed.controller.js — CONTROLLER bed management (Rawat Inap)
// =====================================================================

import * as service from "./bed.service.js";
import { ValidationError } from "./bed.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function getBoard(req, res) {
  try {
    res.json(await service.getBoard());
  } catch (err) {
    handleError(res, err);
  }
}

export async function getAdmittable(req, res) {
  try {
    res.json(await service.getAdmittable());
  } catch (err) {
    handleError(res, err);
  }
}

export async function assign(req, res) {
  try {
    res.json(await service.assign(req.params.id, req.body.encounter_id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function release(req, res) {
  try {
    res.json(await service.release(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function transfer(req, res) {
  try {
    res.json(await service.transfer(req.params.id, req.body.to_bed_id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function maintenance(req, res) {
  try {
    res.json(await service.setMaintenance(req.params.id, req.body.on));
  } catch (err) {
    handleError(res, err);
  }
}
