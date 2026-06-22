// Dashboard / Laporan (P9)
export type Dashboard = {
  pasien_total: number;
  encounter: { today: number; aktif: number; total: number };
  encounter_by_tipe: { tipe: string; n: number }[];
  bed: { total: number; terisi: number; kosong: number; maintenance: number; occupancy: number };
  billing: { pendapatan: number; outstanding: number; lunas_count: number; draft_count: number };
  top_diagnosa: { nama: string; n: number }[];
  orders_by_jenis: { jenis: string; pending: number; done: number; total: number }[];
  low_stock: number;
};
