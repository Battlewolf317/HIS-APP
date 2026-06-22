// =====================================================================
// report.controller.js — CONTROLLER Dashboard / Laporan
// =====================================================================

import * as service from "./report.service.js";

export async function getDashboard(req, res) {
  try {
    res.json(await service.getDashboard());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}
