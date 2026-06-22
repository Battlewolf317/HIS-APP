// =====================================================================
// asisten.repository.js — kumpulkan konteks klinis pasien (untuk Asisten Klinis)
//  Mengambil: diagnosa, obat/resep, alergi, kunjungan, operasi, penunjang, CPPT.
// =====================================================================

import pool from "../../config/db.js";

const one = (sql, p) => pool.query(sql, p).then((r) => r.rows[0]);
const many = (sql, p) => pool.query(sql, p).then((r) => r.rows);

export function patient(id) {
  return one("SELECT * FROM patient WHERE id = $1", [id]);
}

export function diagnosa(id) {
  return many(
    `SELECT m.diagnosa_code, m.diagnosa_nama, m.created_at, e.encounter_no
       FROM medical_record m
       JOIN encounter e ON e.id = m.encounter_id
      WHERE e.patient_id = $1 AND m.diagnosa_nama IS NOT NULL
      ORDER BY m.created_at DESC`,
    [id]
  );
}

// Obat/resep: gabungan dari order RESEP (deskripsi) + obat yang didispensing (nama item)
export function obat(id) {
  return many(
    `SELECT co.id AS order_id, co.deskripsi, co.created_at, co.status,
            e.encounter_no, ii.nama AS item_nama, pd.qty
       FROM clinical_order co
       JOIN encounter e ON e.id = co.encounter_id
       LEFT JOIN pharmacy_dispense pd ON pd.order_id = co.id
       LEFT JOIN inv_item ii ON ii.id = pd.item_id
      WHERE e.patient_id = $1 AND co.jenis = 'RESEP'
      ORDER BY co.created_at DESC`,
    [id]
  );
}

export function encounters(id) {
  return many(
    `SELECT encounter_no, tipe, poli, dokter, keluhan, tgl_masuk, tgl_keluar, status
       FROM encounter
      WHERE patient_id = $1 AND cancelled = false
      ORDER BY tgl_masuk DESC NULLS LAST, id DESC`,
    [id]
  );
}

export function operasi(id) {
  return many(
    `SELECT o.nama_tindakan, o.kategori, o.tgl_operasi, o.status, e.encounter_no
       FROM operasi o JOIN encounter e ON e.id = o.encounter_id
      WHERE e.patient_id = $1 ORDER BY o.tgl_operasi DESC NULLS LAST`,
    [id]
  );
}

export function penunjang(id) {
  return many(
    `SELECT co.jenis, co.deskripsi, co.hasil, co.status, co.created_at, e.encounter_no
       FROM clinical_order co JOIN encounter e ON e.id = co.encounter_id
      WHERE e.patient_id = $1 AND co.jenis IN ('LAB','RAD')
      ORDER BY co.created_at DESC`,
    [id]
  );
}

export function cppt(id) {
  return many(
    `SELECT c.profesi, c.subjektif, c.objektif, c.asesmen, c.plan, c.created_at, e.encounter_no
       FROM cppt c JOIN encounter e ON e.id = c.encounter_id
      WHERE e.patient_id = $1 ORDER BY c.created_at DESC LIMIT 20`,
    [id]
  );
}

// alergi/pantangan dari order diet
export function alergi(id) {
  return many(
    `SELECT DISTINCT d.pantangan
       FROM diet_order d JOIN encounter e ON e.id = d.encounter_id
      WHERE e.patient_id = $1 AND d.pantangan IS NOT NULL AND d.pantangan <> ''`,
    [id]
  );
}

// ruang rawat / bed yang sedang ditempati (kunjungan aktif)
export function kamar(id) {
  return many(
    `SELECT b.kode_bed, b.status AS bed_status, w.nama AS ward_nama, w.kelas,
            e.encounter_no, e.tipe, e.tgl_masuk
       FROM bed b
       JOIN ward w ON w.id = b.ward_id
       JOIN encounter e ON e.id = b.encounter_id
      WHERE e.patient_id = $1 AND e.cancelled = false AND e.status = 'AKTIF'
      ORDER BY b.updated_at DESC`,
    [id]
  );
}
