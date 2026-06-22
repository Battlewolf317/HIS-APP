// =====================================================================
// types.ts — modul Discharge / Resep Pulang (ringkasan pulang)
// =====================================================================

export type KondisiPulang = "SEMBUH" | "MEMBAIK" | "RUJUK" | "APS" | "MENINGGAL";

export type Discharge = {
  id: number;
  encounter_id: number;
  kondisi_pulang: KondisiPulang | null;
  cara_pulang: string | null;
  diagnosa_akhir: string | null;
  ringkasan: string | null;
  instruksi: string | null;
  obat_pulang: string | null;
  kontrol_tgl: string | null;
  dokter: string | null;
  petugas: string | null;
  created_at: string;
  updated_at: string;
  // hasil JOIN (di list)
  encounter_no?: string;
  tipe?: string;
  pasien_nama?: string;
  mrn?: string;
};

export type DischargeForm = {
  kondisi_pulang: KondisiPulang;
  cara_pulang: string;
  diagnosa_akhir: string;
  ringkasan: string;
  instruksi: string;
  obat_pulang: string;
  kontrol_tgl: string;
  dokter: string;
  petugas: string;
};
