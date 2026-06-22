// Bentuk data pasien (mirip TYPES struktur ABAP)
export type Patient = {
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
  cancelled: boolean;
  created_at: string;
  updated_at: string;
};

// Data buat form (tanpa id & field auto)
export type PatientInput = {
  mrn: string;
  nik: string;
  nama: string;
  tgl_lahir: string;
  jenis_kelamin: string;
  alamat: string;
  no_hp: string;
  penjamin: string;
  no_penjamin: string;
};
