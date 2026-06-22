// =====================================================================
// types.ts — modul SDM (pegawai + presensi)
// =====================================================================

export type PegawaiStatus = "AKTIF" | "NONAKTIF";
export type PresensiStatus = "HADIR" | "IZIN" | "SAKIT" | "ALPA" | "CUTI";

export type Pegawai = {
  id: number;
  nip: string;
  nama: string;
  jabatan: string | null;
  unit: string | null;
  no_hp: string | null;
  status: PegawaiStatus;
  created_at: string;
  updated_at: string;
};

export type PegawaiForm = {
  nip: string;
  nama: string;
  jabatan: string;
  unit: string;
  no_hp: string;
  status: PegawaiStatus;
};

export type Presensi = {
  id: number;
  pegawai_id: number;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: PresensiStatus;
  catatan: string | null;
  // join
  nip: string;
  pegawai_nama: string;
  unit: string | null;
};

export type PresensiForm = {
  pegawai_id: number | "";
  tanggal: string;
  jam_masuk: string;
  jam_pulang: string;
  status: PresensiStatus;
  catatan: string;
};
