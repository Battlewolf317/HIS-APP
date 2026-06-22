// =====================================================================
// ProfilPage.tsx — Profil Pasien (360° view)
//  Cari/pilih pasien → tampilkan demografi, statistik kunjungan,
//  riwayat kunjungan, riwayat diagnosa, alergi/pantangan.
// =====================================================================

import { useState, useEffect } from "react";
import type { Patient } from "../patient/types";
import { getPatients } from "../patient/patientApi";
import type { PatientProfile } from "./types";
import { getProfile } from "./profilApi";
import { Toolbar, Btn, Badge, Card, StatCard, sap, th, td, tableStyle, inp } from "../shell/ui";

const TIPE_COLOR: Record<string, string> = { RJ: sap.blue, RI: sap.orange, IGD: sap.red };
const STATUS_COLOR: Record<string, string> = { AKTIF: sap.green, SELESAI: sap.textSub, BATAL: sap.red };

export default function ProfilPage({ initialPatientId, onBack }: { initialPatientId?: number; onBack?: () => void }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<number | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPatients().then((p) => setPatients(p)).catch(() => {});
  }, []);

  // kalau dibuka dari klik pasien, langsung muat profilnya
  useEffect(() => {
    if (initialPatientId) pilih(initialPatientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPatientId]);

  async function pilih(id: number) {
    setSelId(id);
    setLoading(true);
    try { setProfile(await getProfile(id)); } finally { setLoading(false); }
  }

  const filtered = q
    ? patients.filter((p) => `${p.nama} ${p.mrn} ${p.nik ?? ""}`.toLowerCase().includes(q.toLowerCase()))
    : patients;

  return (
    <div>
      {onBack && (
        <div style={{ marginBottom: 12 }}>
          <Btn icon="←" onClick={onBack}>Kembali ke Daftar Pasien</Btn>
        </div>
      )}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {/* daftar pasien (kiri) — hanya tampil kalau BUKAN dibuka dari klik pasien */}
      {!initialPatientId && (
      <div style={{ width: 280, flexShrink: 0 }}>
        <Card style={{ padding: 12 }}>
          <input style={{ ...inp, marginBottom: 10 }} placeholder="🔍 Cari nama / MRN / NIK" value={q} onChange={(e) => setQ(e.target.value)} />
          <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => pilih(p.id)}
                className="hms-nav-item"
                style={{
                  textAlign: "left", border: `1px solid ${selId === p.id ? sap.blue : sap.line}`, borderRadius: 8,
                  padding: "8px 10px", cursor: "pointer", background: selId === p.id ? "#e8f0fe" : "#fff",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: sap.text }}>{p.nama}</div>
                <div style={{ fontSize: 11, color: sap.textSub }}>{p.mrn} · {p.jenis_kelamin === "L" ? "L" : "P"} · {p.penjamin}</div>
              </button>
            ))}
            {filtered.length === 0 && <div style={{ fontSize: 12, color: sap.textSub, padding: 8 }}>Tidak ada pasien.</div>}
          </div>
        </Card>
      </div>
      )}

      {/* detail profil (kanan) */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!selId ? (
          <Card><p style={{ color: sap.textSub, margin: 0 }}>Pilih pasien untuk melihat profil lengkap.</p></Card>
        ) : loading || !profile ? (
          <Card><p style={{ margin: 0 }}>Memuat profil...</p></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* header demografi */}
            <Card>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${sap.blue}, ${sap.blueDark})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                  {profile.patient.nama.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: 20, color: sap.text }}>{profile.patient.nama}</h3>
                    <Badge text={profile.patient.penjamin} color={profile.patient.penjamin === "BPJS" ? sap.green : profile.patient.penjamin === "UMUM" ? sap.textSub : sap.orange} />
                    {profile.stats.kunjungan_aktif > 0 && <Badge text="SEDANG DIRAWAT" color={sap.blue} />}
                  </div>
                  <div style={{ fontSize: 13, color: sap.textSub, marginTop: 4, display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span><b>MRN:</b> {profile.patient.mrn}</span>
                    <span><b>NIK:</b> {profile.patient.nik ?? "-"}</span>
                    <span><b>{profile.patient.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</b>{profile.patient.umur ? ` · ${fmtUmur(profile.patient.umur)}` : ""}</span>
                    <span><b>HP:</b> {profile.patient.no_hp ?? "-"}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: sap.textSub, marginTop: 3 }}>📍 {profile.patient.alamat ?? "-"}</div>
                </div>
              </div>
            </Card>

            {/* statistik */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <StatCard label="Total Kunjungan" value={profile.stats.total_kunjungan} icon="📋" />
              <StatCard label="Kunjungan Aktif" value={profile.stats.kunjungan_aktif} icon="🟢" color={profile.stats.kunjungan_aktif > 0 ? sap.green : sap.textSub} />
              <StatCard label="Kunjungan Terakhir" value={fmtDate(profile.stats.kunjungan_terakhir)} icon="🕒" color={sap.text} />
              <StatCard label="Riwayat Diagnosa" value={profile.diagnosa.length} icon="🩺" color={sap.orange} />
            </div>

            {/* alergi */}
            {profile.alergi.length > 0 && (
              <Card style={{ borderLeft: `4px solid ${sap.red}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: sap.red, marginBottom: 6 }}>⚠️ ALERGI / PANTANGAN</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {profile.alergi.map((a, i) => (
                    <span key={i} style={{ background: "#fee2e2", color: sap.red, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999 }}>{a}</span>
                  ))}
                </div>
              </Card>
            )}

            {/* riwayat diagnosa */}
            <Card>
              <h4 style={{ margin: "0 0 10px", color: sap.text, fontSize: 15 }}>🩺 Riwayat Diagnosa</h4>
              {profile.diagnosa.length === 0 ? (
                <p style={{ color: sap.textSub, fontSize: 13, margin: 0 }}>Belum ada diagnosa tercatat.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {profile.diagnosa.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "6px 0", borderBottom: i < profile.diagnosa.length - 1 ? `1px solid ${sap.line}` : "none" }}>
                      {d.diagnosa_code && <span style={{ fontFamily: "monospace", background: sap.bgHead, padding: "2px 7px", borderRadius: 6, fontSize: 12, color: sap.blueDark, fontWeight: 700 }}>{d.diagnosa_code}</span>}
                      <span style={{ flex: 1 }}>{d.diagnosa_nama}</span>
                      <span style={{ fontSize: 11, color: sap.textSub }}>{d.encounter_no} · {fmtDate(d.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* riwayat kunjungan */}
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <h4 style={{ margin: 0, padding: "14px 16px 10px", color: sap.text, fontSize: 15 }}>📋 Riwayat Kunjungan</h4>
              {profile.encounters.length === 0 ? (
                <p style={{ color: sap.textSub, fontSize: 13, padding: "0 16px 14px", margin: 0 }}>Belum ada kunjungan.</p>
              ) : (
                <table style={{ ...tableStyle, border: "none", boxShadow: "none", borderRadius: 0 }}>
                  <thead>
                    <tr>
                      <th style={th}>No. Kunjungan</th>
                      <th style={th}>Tipe</th>
                      <th style={th}>Poli / Dokter</th>
                      <th style={th}>Keluhan</th>
                      <th style={th}>Masuk</th>
                      <th style={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.encounters.map((e, i) => (
                      <tr key={e.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                        <td style={td}>{e.encounter_no}</td>
                        <td style={td}><Badge text={e.tipe} color={TIPE_COLOR[e.tipe] ?? sap.textSub} /></td>
                        <td style={td}>{e.poli ?? "-"}{e.dokter ? <span style={{ color: sap.textSub, fontSize: 11 }}> · {e.dokter}</span> : ""}</td>
                        <td style={td}>{e.keluhan ?? "-"}</td>
                        <td style={td}>{fmtDate(e.tgl_masuk)}</td>
                        <td style={td}><Badge text={e.status} color={STATUS_COLOR[e.status] ?? sap.textSub} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <div><Btn icon="🔄" onClick={() => pilih(selId)}>Refresh Profil</Btn></div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

function fmtDate(s: string | null): string {
  if (!s) return "-";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

// umur → "36 th 4 bln 12 hr"
function fmtUmur(u: { tahun: number; bulan: number; hari: number }): string {
  return `${u.tahun} th ${u.bulan} bln ${u.hari} hr`;
}
