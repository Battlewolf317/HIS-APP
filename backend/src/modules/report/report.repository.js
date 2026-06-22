// =====================================================================
// report.repository.js — query agregat untuk Dashboard / Laporan (P9)
// =====================================================================

import pool from "../../config/db.js";

const one = (sql, params = []) => pool.query(sql, params).then((r) => r.rows[0]);
const many = (sql, params = []) => pool.query(sql, params).then((r) => r.rows);

export function patientCount() {
  return one("SELECT COUNT(*)::int AS n FROM patient WHERE cancelled = false");
}

export function encounterStats() {
  return one(`
    SELECT
      COUNT(*) FILTER (WHERE tgl_masuk::date = current_date)::int AS today,
      COUNT(*) FILTER (WHERE status = 'AKTIF')::int                AS aktif,
      COUNT(*)::int                                                AS total
    FROM encounter WHERE cancelled = false`);
}

export function encounterByTipe() {
  return many(`
    SELECT tipe, COUNT(*)::int AS n
      FROM encounter WHERE cancelled = false
     GROUP BY tipe ORDER BY tipe`);
}

export function bedStats() {
  return one(`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'TERISI')::int      AS terisi,
           COUNT(*) FILTER (WHERE status = 'KOSONG')::int      AS kosong,
           COUNT(*) FILTER (WHERE status = 'MAINTENANCE')::int AS maintenance
      FROM bed`);
}

export function billingStats() {
  return one(`
    SELECT
      COALESCE(SUM(total) FILTER (WHERE status = 'LUNAS'),0) AS pendapatan,
      COALESCE(SUM(total) FILTER (WHERE status = 'DRAFT'),0) AS outstanding,
      COUNT(*) FILTER (WHERE status = 'LUNAS')::int          AS lunas_count,
      COUNT(*) FILTER (WHERE status = 'DRAFT')::int          AS draft_count
    FROM bill`);
}

export function topDiagnosa() {
  return many(`
    SELECT diagnosa_nama AS nama, COUNT(*)::int AS n
      FROM medical_record
     WHERE diagnosa_nama IS NOT NULL AND diagnosa_nama <> ''
     GROUP BY diagnosa_nama ORDER BY n DESC, nama LIMIT 10`);
}

export function ordersByJenis() {
  return many(`
    SELECT jenis,
           COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending,
           COUNT(*) FILTER (WHERE status = 'DONE')::int    AS done,
           COUNT(*)::int                                   AS total
      FROM clinical_order
     GROUP BY jenis ORDER BY jenis`);
}

export function lowStockCount() {
  return one("SELECT COUNT(*)::int AS n FROM inv_item WHERE cancelled = false AND stok <= stok_min");
}
