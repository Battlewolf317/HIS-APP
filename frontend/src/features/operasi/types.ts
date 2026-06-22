// =====================================================================
// types.ts — modul Operasi / Jadwal Operasi (OT)
// =====================================================================

export type OperasiStatus = "DIJADWALKAN" | "BERLANGSUNG" | "SELESAI" | "BATAL";

export type Operasi = {
  id: number;
  encounter_id: number;
  nama_tindakan: string;
  kategori: string | null;
  kamar_ot: string | null;
  dokter_bedah: string | null;
  dokter_anestesi: string | null;
  jenis_anestesi: string | null;
  tgl_operasi: string | null;
  durasi_menit: number | null;
  diagnosa_pre: string | null;
  diagnosa_post: string | null;
  status: OperasiStatus;
  catatan: string | null;
  petugas: string | null;
  created_at: string;
  updated_at: string;
  // hasil JOIN
  encounter_no: string;
  tipe: string;
  pasien_nama: string;
  mrn: string;
};

export type OperasiForm = {
  encounter_id: number | "";
  nama_tindakan: string;
  kategori: string;
  kamar_ot: string;
  dokter_bedah: string;
  dokter_anestesi: string;
  jenis_anestesi: string;
  tgl_operasi: string;
  durasi_menit: string;
  diagnosa_pre: string;
  diagnosa_post: string;
  catatan: string;
  petugas: string;
};
