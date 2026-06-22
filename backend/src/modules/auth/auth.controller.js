// =====================================================================
// auth.controller.js — CONTROLLER login + info user aktif
// =====================================================================

import * as service from "./auth.service.js";
import { ValidationError } from "./auth.service.js";

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    res.json(await service.login(username, password));
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}

// GET /api/auth/me — kembalikan identitas dari token (buat frontend cek sesi)
export function me(req, res) {
  res.json({ user: req.user });
}
