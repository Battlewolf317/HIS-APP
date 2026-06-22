// =====================================================================
// profil.controller.js — CONTROLLER profil pasien
// =====================================================================

import * as service from "./profil.service.js";
import { ValidationError } from "./profil.service.js";

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan server" });
}

export async function getProfile(req, res) {
  try {
    res.json(await service.getProfile(req.params.patientId));
  } catch (err) {
    handleError(res, err);
  }
}

export async function getProfileByMrn(req, res) {
  try {
    res.json(await service.getProfileByMrn(req.params.mrn));
  } catch (err) {
    handleError(res, err);
  }
}
