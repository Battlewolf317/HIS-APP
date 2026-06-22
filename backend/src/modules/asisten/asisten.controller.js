// =====================================================================
// asisten.controller.js — CONTROLLER Asisten Klinis
// =====================================================================

import * as service from "./asisten.service.js";
import { ValidationError } from "./asisten.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

// POST /api/asisten/ask  { patientId, question }
export async function ask(req, res) {
  try {
    res.json(await service.ask(req.body.patientId, req.body.question));
  } catch (err) {
    handleError(res, err);
  }
}
