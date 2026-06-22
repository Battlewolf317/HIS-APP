// =====================================================================
// laporan.service.js — komposisi laporan resmi RS
//  Rumus indikator (standar Kemenkes/Barber-Johnson):
//   BOR  = hari perawatan / (jml TT × jml hari) × 100%
//   ALOS = total lama dirawat / jml pasien keluar (hari)
//   TOI  = ((jml TT × jml hari) − hari perawatan) / jml pasien keluar
//   BTO  = jml pasien keluar / jml TT
// =====================================================================

import * as repo from "./laporan.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  const a = new Date(from + "T00:00:00Z");
  const b = new Date(to + "T00:00:00Z");
  const d = Math.round((b - a) / 86400000) + 1; // inklusif
  return d > 0 ? d : 0;
}

export async function getSensus(tanggal) {
  const tgl = tanggal || todayStr();
  const [s, bed] = await Promise.all([repo.sensus(tgl), repo.bedCount()]);
  const occupancy = bed.n > 0 ? Math.round((s.dirawat_ri / bed.n) * 100) : 0;
  return {
    tanggal: tgl,
    bed_total: bed.n,
    ...s,
    occupancy_today: occupancy,
  };
}

export async function getIndikator(from, to) {
  const f = from || todayStr();
  const t = to || todayStr();
  if (f > t) throw new ValidationError("Tanggal awal tidak boleh setelah tanggal akhir");

  const [bed, hr, keluar] = await Promise.all([
    repo.bedCount(),
    repo.hariRawat(f, t),
    repo.pasienKeluar(f, t),
  ]);

  const jmlHari = daysBetween(f, t);
  const jmlTT = bed.n;
  const hariRawat = hr.hari_rawat;
  const pasienKeluar = keluar.jml;
  const totalLos = keluar.total_los;
  const kapasitas = jmlTT * jmlHari; // bed-days tersedia

  const round1 = (x) => Math.round(x * 10) / 10;
  const bor = kapasitas > 0 ? round1((hariRawat / kapasitas) * 100) : 0;
  const alos = pasienKeluar > 0 ? round1(totalLos / pasienKeluar) : 0;
  const toi = pasienKeluar > 0 ? round1((kapasitas - hariRawat) / pasienKeluar) : 0;
  const bto = jmlTT > 0 ? round1(pasienKeluar / jmlTT) : 0;

  return {
    periode: { from: f, to: t, jumlah_hari: jmlHari },
    jml_tt: jmlTT,
    hari_perawatan: hariRawat,
    pasien_keluar: pasienKeluar,
    kapasitas_bed_hari: kapasitas,
    indikator: { BOR: bor, ALOS: alos, TOI: toi, BTO: bto },
    ideal: { BOR: "60-85%", ALOS: "6-9 hari", TOI: "1-3 hari", BTO: "40-50 kali/tahun" },
  };
}

export async function getKunjungan(from, to) {
  const f = from || todayStr();
  const t = to || todayStr();
  if (f > t) throw new ValidationError("Tanggal awal tidak boleh setelah tanggal akhir");
  const [byTipe, byPoli, harian] = await Promise.all([
    repo.kunjunganByTipe(f, t),
    repo.kunjunganByPoli(f, t),
    repo.kunjunganHarian(f, t),
  ]);
  const total = byTipe.reduce((a, r) => a + r.n, 0);
  return { periode: { from: f, to: t }, total, by_tipe: byTipe, by_poli: byPoli, harian };
}

export { ValidationError };
