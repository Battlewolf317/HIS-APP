// =====================================================================
// master.repository.js — CRUD generik master (tabel & kolom dari whitelist)
//  Nama tabel/kolom HANYA dari config (server-side), value diparametrize.
// =====================================================================

import pool from "../../config/db.js";

export function list(ent) {
  return pool.query(`SELECT * FROM ${ent.table} ORDER BY kode`).then((r) => r.rows);
}

export function findById(ent, id) {
  return pool.query(`SELECT * FROM ${ent.table} WHERE id = $1`, [id]).then((r) => r.rows[0]);
}

export function findByKode(ent, kode) {
  return pool.query(`SELECT * FROM ${ent.table} WHERE kode = $1`, [kode]).then((r) => r.rows[0]);
}

export function insert(ent, data) {
  const cols = ent.cols;
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(",");
  const vals = cols.map((c) => data[c]);
  return pool
    .query(`INSERT INTO ${ent.table} (${cols.join(",")}) VALUES (${placeholders}) RETURNING *`, vals)
    .then((r) => r.rows[0]);
}

export function update(ent, id, data) {
  // kode tidak diubah saat update (key bisnis); update kolom selain kode
  const cols = ent.cols.filter((c) => c !== "kode");
  const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(", ");
  const vals = cols.map((c) => data[c]);
  vals.push(id);
  return pool
    .query(`UPDATE ${ent.table} SET ${setClause} WHERE id = $${vals.length} RETURNING *`, vals)
    .then((r) => r.rows[0]);
}

export function remove(ent, id) {
  return pool.query(`DELETE FROM ${ent.table} WHERE id = $1`, [id]).then(() => ({ ok: true }));
}
