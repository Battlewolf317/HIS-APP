// =====================================================================
// laporan.repository.js — query agregat laporan resmi RS
//  (sensus harian, indikator BOR/ALOS/TOI/BTO, statistik kunjungan)
//  Read-only: dihitung dari data encounter + bed yang sudah ada.
// =====================================================================

import pool from "../../config/db.js";

const one = (sql, p = []) => pool.query(sql, p).then((r) => r.rows[0]);
const many = (sql, p = []) => pool.query(sql, p).then((r) => r.rows);

export function bedCount() {
  return one("SELECT COUNT(*)::int AS n FROM bed");
}

// --- SENSUS HARIAN (untuk 1 tanggal) ---
export function sensus(tgl) {
  return one(
    `SELECT
       COUNT(*) FILTER (WHERE tipe='RI' AND tgl_masuk::date = $1)::int  AS masuk_ri,
       COUNT(*) FILTER (WHERE tipe='RI' AND tgl_keluar::date = $1)::int AS keluar_ri,
       COUNT(*) FILTER (WHERE tipe='RI' AND tgl_masuk::date <= $1
                        AND (tgl_keluar IS NULL OR tgl_keluar::date >= $1))::int AS dirawat_ri,
       COUNT(*) FILTER (WHERE tipe='RJ' AND tgl_masuk::date = $1)::int  AS kunjungan_rj,
       COUNT(*) FILTER (WHERE tipe='IGD' AND tgl_masuk::date = $1)::int AS kunjungan_igd
     FROM encounter WHERE cancelled = false`,
    [tgl]
  );
}

// --- INDIKATOR (periode from..to) ---
// hari perawatan (patient-days) RI, di-clip ke dalam periode
export function hariRawat(from, to) {
  return one(
    `SELECT COALESCE(SUM(
        GREATEST(0,
          (LEAST(COALESCE(tgl_keluar::date, $2::date), $2::date)
           - GREATEST(tgl_masuk::date, $1::date))
        )
     ),0)::int AS hari_rawat
     FROM encounter
     WHERE tipe='RI' AND cancelled=false
       AND tgl_masuk::date <= $2::date
       AND COALESCE(tgl_keluar::date, $2::date) >= $1::date`,
    [from, to]
  );
}

// pasien keluar (discharged) dalam periode + total lama dirawat (full LOS, hari)
export function pasienKeluar(from, to) {
  return one(
    `SELECT COUNT(*)::int AS jml,
            COALESCE(SUM(GREATEST(0, (tgl_keluar::date - tgl_masuk::date))),0)::int AS total_los
       FROM encounter
      WHERE tipe='RI' AND cancelled=false
        AND tgl_keluar IS NOT NULL
        AND tgl_keluar::date BETWEEN $1::date AND $2::date`,
    [from, to]
  );
}

// --- STATISTIK KUNJUNGAN (periode from..to) ---
export function kunjunganByTipe(from, to) {
  return many(
    `SELECT tipe, COUNT(*)::int AS n
       FROM encounter
      WHERE cancelled=false AND tgl_masuk::date BETWEEN $1::date AND $2::date
      GROUP BY tipe ORDER BY tipe`,
    [from, to]
  );
}

export function kunjunganByPoli(from, to) {
  return many(
    `SELECT COALESCE(poli,'(tanpa poli)') AS poli, COUNT(*)::int AS n
       FROM encounter
      WHERE cancelled=false AND tgl_masuk::date BETWEEN $1::date AND $2::date
      GROUP BY poli ORDER BY n DESC, poli`,
    [from, to]
  );
}

export function kunjunganHarian(from, to) {
  return many(
    `SELECT tgl_masuk::date AS tanggal, COUNT(*)::int AS n
       FROM encounter
      WHERE cancelled=false AND tgl_masuk::date BETWEEN $1::date AND $2::date
      GROUP BY tgl_masuk::date ORDER BY tanggal`,
    [from, to]
  );
}
