// =====================================================================
// report.service.js — komposisi data Dashboard (P9)
// =====================================================================

import * as repo from "./report.repository.js";

export async function getDashboard() {
  const [
    pasien,
    enc,
    encTipe,
    bed,
    billing,
    diagnosa,
    orders,
    lowStock,
  ] = await Promise.all([
    repo.patientCount(),
    repo.encounterStats(),
    repo.encounterByTipe(),
    repo.bedStats(),
    repo.billingStats(),
    repo.topDiagnosa(),
    repo.ordersByJenis(),
    repo.lowStockCount(),
  ]);

  const occupancy =
    bed.total > 0 ? Math.round((bed.terisi / bed.total) * 100) : 0;

  return {
    pasien_total: pasien.n,
    encounter: enc,
    encounter_by_tipe: encTipe,
    bed: { ...bed, occupancy },
    billing: {
      pendapatan: Number(billing.pendapatan),
      outstanding: Number(billing.outstanding),
      lunas_count: billing.lunas_count,
      draft_count: billing.draft_count,
    },
    top_diagnosa: diagnosa,
    orders_by_jenis: orders,
    low_stock: lowStock.n,
  };
}
