// Antrian (P8)
export type QueueItem = {
  id: number;
  poli: string;
  queue_no: number;
  status: string;          // MENUNGGU / DIPANGGIL / SELESAI
  called_at: string | null;
  encounter_id: number;
  encounter_no: string;
  pasien: string;
  mrn: string;
};

export type Queueable = {
  id: number;              // encounter_id
  encounter_no: string;
  tipe: string;
  poli: string | null;
  dokter: string | null;
  pasien: string;
  mrn: string;
};
