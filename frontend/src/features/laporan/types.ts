// =====================================================================
// types.ts — modul Laporan resmi RS (sensus, indikator, kunjungan)
// =====================================================================

export type Sensus = {
  tanggal: string;
  bed_total: number;
  masuk_ri: number;
  keluar_ri: number;
  dirawat_ri: number;
  kunjungan_rj: number;
  kunjungan_igd: number;
  occupancy_today: number;
};

export type Indikator = {
  periode: { from: string; to: string; jumlah_hari: number };
  jml_tt: number;
  hari_perawatan: number;
  pasien_keluar: number;
  kapasitas_bed_hari: number;
  indikator: { BOR: number; ALOS: number; TOI: number; BTO: number };
  ideal: { BOR: string; ALOS: string; TOI: string; BTO: string };
};

export type Kunjungan = {
  periode: { from: string; to: string };
  total: number;
  by_tipe: { tipe: string; n: number }[];
  by_poli: { poli: string; n: number }[];
  harian: { tanggal: string; n: number }[];
};
