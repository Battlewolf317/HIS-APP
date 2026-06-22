// =====================================================================
// diagnostic.controller.js — CONTROLLER penunjang (Lab / Radiologi)
// =====================================================================

import * as service from "./diagnostic.service.js";
import { ValidationError } from "./diagnostic.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function getWorklist(req, res) {
  try {
    res.json(await service.getWorklist(req.query.jenis));
  } catch (err) {
    handleError(res, err);
  }
}

export async function getDone(req, res) {
  try {
    res.json(await service.getDone(req.query.jenis));
  } catch (err) {
    handleError(res, err);
  }
}

export async function submitResult(req, res) {
  try {
    res.json(await service.submitResult(req.body.order_id, req.body.hasil));
  } catch (err) {
    handleError(res, err);
  }
}
