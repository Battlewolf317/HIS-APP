// =====================================================================
// pharmacy.controller.js — CONTROLLER farmasi / dispensing
// =====================================================================

import * as service from "./pharmacy.service.js";
import { ValidationError } from "./pharmacy.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function getPendingResep(req, res) {
  try {
    res.json(await service.getPendingResep());
  } catch (err) {
    handleError(res, err);
  }
}

export async function getDispenseHistory(req, res) {
  try {
    res.json(await service.getDispenseHistory(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function dispense(req, res) {
  try {
    res.status(201).json(await service.dispense(req.body, req.user));
  } catch (err) {
    handleError(res, err);
  }
}
