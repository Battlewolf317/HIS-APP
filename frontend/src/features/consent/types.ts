// =====================================================================
// types.ts — modul Informed Consent
// =====================================================================

export type Keputusan = "SETUJU" | "TOLAK";

export type Consent = {
  id: number;
  encounter_id: number;
  jenis_tindakan: string;
  pemberi_info: string | null;
  penerima_info: string | null;
  hubungan: string | null;
  keputusan: Keputusan;
  catatan: string | null;
  tgl_consent: string;
  petugas: string | null;
  created_at: string;
  encounter_no: string;
  tipe: string;
  pasien_nama: string;
  mrn: string;
};

export type ConsentForm = {
  encounter_id: number | "";
  jenis_tindakan: string;
  pemberi_info: string;
  penerima_info: string;
  hubungan: string;
  keputusan: Keputusan;
  catatan: string;
  petugas: string;
};
