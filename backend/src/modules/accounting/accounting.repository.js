// =====================================================================
// accounting.repository.js — AKSES DATABASE akun (COA) + jurnal
// =====================================================================

import pool from "../../config/db.js";

export function findAkun() {
  return pool.query("SELECT * FROM akun ORDER BY kode").then((r) => r.rows);
}

export function findAkunByKode(kode) {
  return pool.query("SELECT * FROM akun WHERE kode = $1", [kode]).then((r) => r.rows[0]);
}

export function countToday() {
  return pool
    .query("SELECT COUNT(*)::int AS n FROM jurnal WHERE tanggal = current_date")
    .then((r) => r.rows[0].n);
}

// insert jurnal header + lines dalam 1 transaksi (atomic)
export async function insertJurnal(header, lines) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const j = await client.query(
      `INSERT INTO jurnal (no_jurnal, tanggal, keterangan, ref_tipe, ref_id)
       VALUES ($1, COALESCE($2, current_date), $3, $4, $5) RETURNING *`,
      [header.no_jurnal, header.tanggal || null, header.keterangan || null, header.ref_tipe || null, header.ref_id || null]
    );
    const jurnal = j.rows[0];
    for (const ln of lines) {
      await client.query(
        `INSERT INTO jurnal_line (jurnal_id, akun_id, debit, kredit)
         VALUES ($1,$2,$3,$4)`,
        [jurnal.id, ln.akun_id, ln.debit || 0, ln.kredit || 0]
      );
    }
    await client.query("COMMIT");
    return jurnal;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// list jurnal + lines (join akun) — dikelompokkan di service
export function findJurnal({ ref_tipe } = {}) {
  const params = [];
  let clause = "";
  if (ref_tipe) {
    params.push(ref_tipe);
    clause = "WHERE j.ref_tipe = $1";
  }
  return pool
    .query(
      `SELECT j.id, j.no_jurnal, j.tanggal, j.keterangan, j.ref_tipe, j.ref_id, j.created_at,
              l.akun_id, a.kode AS akun_kode, a.nama AS akun_nama, l.debit, l.kredit
         FROM jurnal j
         JOIN jurnal_line l ON l.jurnal_id = j.id
         JOIN akun a ON a.id = l.akun_id
         ${clause}
        ORDER BY j.id DESC, l.id ASC`,
      params
    )
    .then((r) => r.rows);
}

// neraca saldo (trial balance): total debit/kredit per akun + saldo
export function trialBalance() {
  return pool
    .query(
      `SELECT a.id, a.kode, a.nama, a.tipe, a.saldo_normal,
              COALESCE(SUM(l.debit),0)  AS total_debit,
              COALESCE(SUM(l.kredit),0) AS total_kredit
         FROM akun a
         LEFT JOIN jurnal_line l ON l.akun_id = a.id
        GROUP BY a.id
        ORDER BY a.kode`
    )
    .then((r) => r.rows);
}
