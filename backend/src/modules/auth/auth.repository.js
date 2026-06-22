// =====================================================================
// auth.repository.js — AKSES DATABASE user
// =====================================================================

import pool from "../../config/db.js";

export function findByUsername(username) {
  return pool
    .query("SELECT * FROM app_user WHERE username = $1 AND active = true", [username])
    .then((r) => r.rows[0]);
}
