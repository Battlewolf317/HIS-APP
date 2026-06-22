// =====================================================================
// profil.service.js — komposisi profil pasien (360° view)
// =====================================================================

import * as repo from "./profil.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function hitungUmur(tglLahir) {
  if (!tglLahir) return null;
  const lahir = new Date(tglLahir);
  if (Number.isNaN(lahir.getTime())) return null;
  const now = new Date();

  let tahun = now.getFullYear() - lahir.getFullYear();
  let bulan = now.getMonth() - lahir.getMonth();
  let hari = now.getDate() - lahir.getDate();

  if (hari < 0) {
    // pinjam hari dari bulan sebelumnya
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    hari += prevMonth.getDate();
    bulan--;
  }
  if (bulan < 0) {
    bulan += 12;
    tahun--;
  }
  if (tahun < 0) return null; // tanggal lahir di masa depan

  return { tahun, bulan, hari };
}

export async function getProfile(patientId) {
  if (!patientId) throw new ValidationError("patientId wajib diisi");
  const p = await repo.patient(patientId);
  if (!p) throw new ValidationError("Pasien tidak ditemukan");
  return assemble(p);
}

export async function getProfileByMrn(mrn) {
  if (!mrn) throw new ValidationError("MRN wajib diisi");
  const p = await repo.patientByMrn(mrn);
  if (!p) throw new ValidationError("Pasien tidak ditemukan");
  return assemble(p);
}

async function assemble(p) {
  const [st, enc, dx, alg] = await Promise.all([
    repo.stats(p.id),
    repo.encounters(p.id),
    repo.diagnosa(p.id),
    repo.alergi(p.id),
  ]);

  return {
    patient: { ...p, umur: hitungUmur(p.tgl_lahir) },
    stats: {
      total_kunjungan: st.total_kunjungan,
      kunjungan_aktif: st.kunjungan_aktif,
      kunjungan_terakhir: st.kunjungan_terakhir,
    },
    encounters: enc,
    diagnosa: dx,
    alergi: alg.map((a) => a.pantangan),
  };
}

export { ValidationError };
