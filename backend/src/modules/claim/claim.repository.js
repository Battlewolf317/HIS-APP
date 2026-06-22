// =====================================================================
// claim.repository.js — AKSES DATABASE klaim penjamin (piutang)
// =====================================================================

import pool from "../../config/db.js";

// daftar penjamin (master payer)
export function findPenjamin() {
  return pool.query("SELECT * FROM penjamin ORDER BY nama").then((r) => r.rows);
}

export function findPenjaminById(id) {
  return pool.query("SELECT * FROM penjamin WHERE id = $1", [id]).then((r) => r.rows[0]);
}

// list klaim + nama penjamin (join), filter opsional status/penjamin
export function findClaims({ status, penjaminId } = {}) {
  const where = [];
  const params = [];
  if (status) {
    params.push(status);
    where.push(`c.status = $${params.length}`);
  }
  if (penjaminId) {
    params.push(penjaminId);
    where.push(`c.penjamin_id = $${params.length}`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return pool
    .query(
      `SELECT c.*, p.nama AS penjamin_nama, p.jenis AS penjamin_jenis,
              (current_date - c.tgl_klaim) AS umur_hari
         FROM claim c
         JOIN penjamin p ON p.id = c.penjamin_id
         ${clause}
        ORDER BY c.id DESC`,
      params
    )
    .then((r) => r.rows);
}

export function findById(id) {
  return pool.query("SELECT * FROM claim WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function insert(data) {
  const { no_klaim, penjamin_id, encounter_id, bill_id, pasien, jumlah_tagih, keterangan } = data;
  return pool
    .query(
      `INSERT INTO claim (no_klaim, penjamin_id, encounter_id, bill_id, pasien, jumlah_tagih, keterangan)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [no_klaim, penjamin_id, encounter_id || null, bill_id || null, pasien || null, jumlah_tagih, keterangan || null]
    )
    .then((r) => r.rows[0]);
}

// update status (+ field terkait approve/pay/reject)
export function updateStatus(id, fields) {
  const sets = ["status = $2", "updated_at = now()"];
  const params = [id, fields.status];
  if (fields.jumlah_setuju !== undefined) {
    params.push(fields.jumlah_setuju);
    sets.push(`jumlah_setuju = $${params.length}`);
  }
  if (fields.tgl_bayar !== undefined) {
    params.push(fields.tgl_bayar);
    sets.push(`tgl_bayar = $${params.length}`);
  }
  if (fields.keterangan !== undefined) {
    params.push(fields.keterangan);
    sets.push(`keterangan = $${params.length}`);
  }
  return pool
    .query(`UPDATE claim SET ${sets.join(", ")} WHERE id = $1 RETURNING *`, params)
    .then((r) => r.rows[0]);
}

// hitung nomor urut klaim hari ini (buat generate no_klaim)
export function countToday() {
  return pool
    .query("SELECT COUNT(*)::int AS n FROM claim WHERE tgl_klaim = current_date")
    .then((r) => r.rows[0].n);
}

// ringkasan aging piutang (claim belum PAID/REJECTED), bucket umur
export function agingSummary() {
  return pool
    .query(
      `SELECT
         COALESCE(SUM(sisa),0) AS total_piutang,
         COALESCE(SUM(CASE WHEN umur <= 30 THEN sisa ELSE 0 END),0) AS b0_30,
         COALESCE(SUM(CASE WHEN umur BETWEEN 31 AND 60 THEN sisa ELSE 0 END),0) AS b31_60,
         COALESCE(SUM(CASE WHEN umur BETWEEN 61 AND 90 THEN sisa ELSE 0 END),0) AS b61_90,
         COALESCE(SUM(CASE WHEN umur > 90 THEN sisa ELSE 0 END),0) AS b90p,
         COUNT(*)::int AS jml_klaim
       FROM (
         SELECT (current_date - tgl_klaim) AS umur,
                CASE WHEN jumlah_setuju > 0 THEN jumlah_setuju ELSE jumlah_tagih END AS sisa
           FROM claim
          WHERE status NOT IN ('PAID','REJECTED')
       ) t`
    )
    .then((r) => r.rows[0]);
}
