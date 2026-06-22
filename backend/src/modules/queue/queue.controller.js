// =====================================================================
// queue.controller.js — CONTROLLER antrian
// =====================================================================

import * as service from "./queue.service.js";
import { ValidationError } from "./queue.service.js";

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

export async function getQueueable(req, res) {
  try {
    res.json(await service.getQueueable());
  } catch (err) {
    handleError(res, err);
  }
}

export async function take(req, res) {
  try {
    res.status(201).json(await service.take(req.body.encounter_id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function call(req, res) {
  try {
    res.json(await service.call(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}

export async function done(req, res) {
  try {
    res.json(await service.done(req.params.id));
  } catch (err) {
    handleError(res, err);
  }
}
