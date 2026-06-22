// =====================================================================
// order.repository.js — AKSES DATABASE order/CPOE (clinical_order)
// =====================================================================

import pool from "../../config/db.js";

export function findByEncounter(encounterId) {
  return pool
    .query("SELECT * FROM clinical_order WHERE encounter_id = $1 ORDER BY id DESC", [encounterId])
    .then((r) => r.rows);
}

export function findById(id) {
  return pool
    .query("SELECT * FROM clinical_order WHERE id = $1", [id])
    .then((r) => r.rows[0]);
}

export function insert(data) {
  const { encounter_id, jenis, deskripsi, harga } = data;
  return pool
    .query(
      `INSERT INTO clinical_order (encounter_id, jenis, deskripsi, harga)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [encounter_id, jenis, deskripsi, harga]
    )
    .then((r) => r.rows[0]);
}

export function setStatus(id, status, hasil) {
  return pool
    .query(
      `UPDATE clinical_order SET status = $1, hasil = COALESCE($2, hasil), updated_at = now()
        WHERE id = $3 RETURNING *`,
      [status, hasil ?? null, id]
    )
    .then((r) => r.rows[0]);
}
