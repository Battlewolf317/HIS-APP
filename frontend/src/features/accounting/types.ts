// P12 Akuntansi — tipe data (NUMERIC dari PG datang sebagai string)

export type Akun = {
  id: number;
  kode: string;
  nama: string;
  tipe: string;           // ASET/KEWAJIBAN/EKUITAS/PENDAPATAN/BEBAN
  saldo_normal: string;   // D / K
};

export type JurnalLine = {
  akun_id: number;
  akun_kode: string;
  akun_nama: string;
  debit: string;
  kredit: string;
};

export type Jurnal = {
  id: number;
  no_jurnal: string;
  tanggal: string;
  keterangan: string | null;
  ref_tipe: string | null;   // PAYMENT / CLAIM / MANUAL
  ref_id: number | null;
  created_at: string;
  lines: JurnalLine[];
};

export type TrialRow = {
  id: number;
  kode: string;
  nama: string;
  tipe: string;
  saldo_normal: string;
  total_debit: string;
  total_kredit: string;
};

export type ManualLine = { akun_id: number; debit: number; kredit: number };
