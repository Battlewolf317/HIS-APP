// =====================================================================
// master.config.js — whitelist entitas master + kolom (anti SQL-injection)
//  Hanya tabel & kolom yang terdaftar di sini yang boleh di-CRUD.
// =====================================================================

export const ENTITIES = {
  poli: { table: "poli", cols: ["kode", "nama"] },
  dokter: { table: "dokter", cols: ["kode", "nama", "spesialisasi", "poli"] },
  tarif: { table: "tarif", cols: ["kode", "nama", "kategori", "harga"] },
  penjamin: { table: "penjamin", cols: ["kode", "nama", "jenis"] },
};

export function getEntity(name) {
  return ENTITIES[name] || null;
}
