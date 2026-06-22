// =====================================================================
// types.ts — modul MCU (Medical Check Up)
// =====================================================================

export type McuStatus = "TERDAFTAR" | "PROSES" | "SELESAI";
export type McuKesimpulan = "LAYAK" | "LAYAK_CATATAN" | "TIDAK_LAYAK";

export type Mcu = {
  id: number;
  encounter_id: number;
  paket: string;
  perusahaan: string | null;
  hasil_ringkas: string | null;
  kesimpulan: McuKesimpulan | null;
  rekomendasi: string | null;
  dokter_pemeriksa: string | null;
  status: McuStatus;
  petugas: string | null;
  created_at: string;
  updated_at: string;
  encounter_no: string;
  tipe: string;
  pasien_nama: string;
  mrn: string;
};

export type McuForm = {
  encounter_id: number | "";
  paket: string;
  perusahaan: string;
  hasil_ringkas: string;
  kesimpulan: McuKesimpulan | "";
  rekomendasi: string;
  dokter_pemeriksa: string;
  petugas: string;
};
