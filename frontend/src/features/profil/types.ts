// =====================================================================
// types.ts — modul Profil Pasien (360° view)
// =====================================================================

export type ProfilEncounter = {
  id: number;
  encounter_no: string;
  tipe: string;
  poli: string | null;
  dokter: string | null;
  keluhan: string | null;
  tgl_masuk: string | null;
  tgl_keluar: string | null;
  status: string;
};

export type ProfilDiagnosa = {
  diagnosa_code: string | null;
  diagnosa_nama: string;
  created_at: string;
  encounter_no: string;
};

export type PatientProfile = {
  patient: {
    id: number;
    mrn: string;
    nik: string | null;
    nama: string;
    tgl_lahir: string | null;
    jenis_kelamin: string | null;
    alamat: string | null;
    no_hp: string | null;
    penjamin: string;
    no_penjamin: string | null;
    umur: { tahun: number; bulan: number; hari: number } | null;
  };
  stats: {
    total_kunjungan: number;
    kunjungan_aktif: number;
    kunjungan_terakhir: string | null;
  };
  encounters: ProfilEncounter[];
  diagnosa: ProfilDiagnosa[];
  alergi: string[];
};
