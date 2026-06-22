// Tagihan + item (angka dari PostgreSQL NUMERIC datang sebagai string)
export type BillItem = {
  id: number;
  bill_id: number;
  deskripsi: string;
  qty: number;
  harga: string;
  subtotal: string;
};

// P10 Kasir lanjutan — transaksi pembayaran
export type Payment = {
  id: number;
  bill_id: number;
  jenis: string;          // BAYAR / DEPOSIT / REFUND
  metode: string;         // TUNAI / DEBIT / KREDIT / TRANSFER / BPJS / ASURANSI
  jumlah: string;
  keterangan: string | null;
  kasir: string | null;
  created_at: string;
};

export type Bill = {
  id: number;
  encounter_id: number;
  status: string;          // DRAFT / LUNAS
  total: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  items: BillItem[];
  payments: Payment[];
  terbayar: number;
  sisa: number;
};

export type PaymentInput = {
  jenis: string;
  metode: string;
  jumlah: number;
  keterangan?: string;
};
