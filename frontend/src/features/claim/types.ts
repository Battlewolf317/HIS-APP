// P11 Piutang & Klaim — tipe data (NUMERIC dari PG datang sebagai string)

export type Penjamin = {
  id: number;
  kode: string;
  nama: string;
  jenis: string;          // BPJS / ASURANSI / PERUSAHAAN
};

export type Claim = {
  id: number;
  no_klaim: string;
  penjamin_id: number;
  penjamin_nama: string;
  penjamin_jenis: string;
  encounter_id: number | null;
  bill_id: number | null;
  pasien: string | null;
  jumlah_tagih: string;
  jumlah_setuju: string;
  status: string;         // OPEN/SUBMITTED/APPROVED/PAID/REJECTED
  tgl_klaim: string;
  tgl_bayar: string | null;
  keterangan: string | null;
  umur_hari: number;
};

export type Aging = {
  total_piutang: string;
  b0_30: string;
  b31_60: string;
  b61_90: string;
  b90p: string;
  jml_klaim: number;
};

export type ClaimInput = {
  penjamin_id: number;
  pasien?: string;
  jumlah_tagih: number;
  keterangan?: string;
};
