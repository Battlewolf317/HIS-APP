// =====================================================================
// LaporanPage.tsx — Laporan resmi RS
//  Tab: Sensus Harian | Indikator (BOR/ALOS/TOI/BTO) | Statistik Kunjungan
//  Read-only, dihitung dari data encounter + bed.
// =====================================================================

import { useState, useEffect } from "react";
import type { Sensus, Indikator, Kunjungan } from "./types";
import { getSensus, getIndikator, getKunjungan } from "./laporanApi";
import { Toolbar, Btn, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };

type Tab = "sensus" | "indikator" | "kunjungan";

export default function LaporanPage() {
  const [tab, setTab] = useState<Tab>("sensus");

  const tabBtn = (key: Tab, text: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        padding: "6px 14px", fontSize: 13, cursor: "pointer", border: `1px solid ${sap.line}`,
        borderBottom: tab === key ? `2px solid ${sap.blue}` : `1px solid ${sap.line}`,
        background: tab === key ? "#fff" : sap.bgHead, color: tab === key ? sap.blue : sap.text,
        fontWeight: tab === key ? 700 : 400,
      }}
    >
      {text}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
        {tabBtn("sensus", "Sensus Harian")}
        {tabBtn("indikator", "Indikator (BOR/ALOS)")}
        {tabBtn("kunjungan", "Statistik Kunjungan")}
      </div>
      {tab === "sensus" && <SensusTab />}
      {tab === "indikator" && <IndikatorTab />}
      {tab === "kunjungan" && <KunjunganTab />}
    </div>
  );
}

// kartu KPI kecil
function Kpi({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 130, border: `1px solid ${sap.line}`, borderRadius: 6, padding: "12px 14px", background: "#fff" }}>
      <div style={{ fontSize: 11, color: sap.textSub, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color ?? sap.blue, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: sap.textSub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ---------------- SENSUS ----------------
function SensusTab() {
  const [tgl, setTgl] = useState(today());
  const [data, setData] = useState<Sensus | null>(null);
  const [loading, setLoading] = useState(false);

  async function muat() {
    setLoading(true);
    try { setData(await getSensus(tgl)); } finally { setLoading(false); }
  }
  useEffect(() => { muat(); /* eslint-disable-next-line */ }, [tgl]);

  return (
    <div>
      <Toolbar>
        <label style={{ fontSize: 12, color: sap.textSub }}>Tanggal:</label>
        <input style={{ ...inp, width: 160 }} type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} />
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
      </Toolbar>
      {loading || !data ? <p>Memuat data...</p> : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Kpi label="Pasien Dirawat (RI)" value={data.dirawat_ri} sub={`dari ${data.bed_total} TT`} />
          <Kpi label="Occupancy Hari Ini" value={`${data.occupancy_today}%`} color={data.occupancy_today > 85 ? sap.red : sap.green} />
          <Kpi label="Masuk RI" value={data.masuk_ri} />
          <Kpi label="Keluar RI" value={data.keluar_ri} />
          <Kpi label="Kunjungan RJ" value={data.kunjungan_rj} />
          <Kpi label="Kunjungan IGD" value={data.kunjungan_igd} color={sap.orange} />
        </div>
      )}
    </div>
  );
}

// ---------------- INDIKATOR ----------------
function IndikatorTab() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<Indikator | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function muat() {
    setLoading(true); setErr("");
    try { setData(await getIndikator(from, to)); }
    catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { muat(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <Toolbar>
        <label style={{ fontSize: 12, color: sap.textSub }}>Dari:</label>
        <input style={{ ...inp, width: 150 }} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <label style={{ fontSize: 12, color: sap.textSub }}>s/d:</label>
        <input style={{ ...inp, width: 150 }} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Btn icon="📊" primary onClick={muat}>Hitung</Btn>
      </Toolbar>
      {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}
      {loading || !data ? <p>Memuat data...</p> : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <Kpi label="BOR" value={`${data.indikator.BOR}%`} sub={`ideal ${data.ideal.BOR}`} color={data.indikator.BOR >= 60 && data.indikator.BOR <= 85 ? sap.green : sap.orange} />
            <Kpi label="ALOS" value={`${data.indikator.ALOS} hr`} sub={`ideal ${data.ideal.ALOS}`} />
            <Kpi label="TOI" value={`${data.indikator.TOI} hr`} sub={`ideal ${data.ideal.TOI}`} />
            <Kpi label="BTO" value={`${data.indikator.BTO}x`} sub={`ideal ${data.ideal.BTO}`} />
          </div>
          <table style={tableStyle}>
            <tbody>
              <tr><td style={td}>Periode</td><td style={td}>{data.periode.from} s/d {data.periode.to} ({data.periode.jumlah_hari} hari)</td></tr>
              <tr><td style={td}>Jumlah Tempat Tidur (TT)</td><td style={td}>{data.jml_tt}</td></tr>
              <tr><td style={td}>Hari Perawatan (patient-days)</td><td style={td}>{data.hari_perawatan}</td></tr>
              <tr><td style={td}>Pasien Keluar (hidup + mati)</td><td style={td}>{data.pasien_keluar}</td></tr>
              <tr><td style={td}>Kapasitas Bed-Hari (TT × hari)</td><td style={td}>{data.kapasitas_bed_hari}</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: 11, color: sap.textSub, marginTop: 8 }}>
            Rumus Barber-Johnson/Kemenkes. BOR = hari perawatan ÷ (TT × hari) × 100%. Nilai bergantung kelengkapan data tgl masuk/keluar kunjungan RI.
          </p>
        </>
      )}
    </div>
  );
}

// ---------------- KUNJUNGAN ----------------
function KunjunganTab() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<Kunjungan | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function muat() {
    setLoading(true); setErr("");
    try { setData(await getKunjungan(from, to)); }
    catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { muat(); /* eslint-disable-next-line */ }, []);

  const maxPoli = data ? Math.max(1, ...data.by_poli.map((p) => p.n)) : 1;

  return (
    <div>
      <Toolbar>
        <label style={{ fontSize: 12, color: sap.textSub }}>Dari:</label>
        <input style={{ ...inp, width: 150 }} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <label style={{ fontSize: 12, color: sap.textSub }}>s/d:</label>
        <input style={{ ...inp, width: 150 }} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Btn icon="📊" primary onClick={muat}>Tampilkan</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>{data && `Total ${data.total} kunjungan`}</span>
      </Toolbar>
      {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}
      {loading || !data ? <p>Memuat data...</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <h4 style={{ color: sap.blue, margin: "0 0 8px" }}>Per Tipe</h4>
            <table style={tableStyle}>
              <thead><tr><th style={th}>Tipe</th><th style={{ ...th, textAlign: "right" }}>Jumlah</th></tr></thead>
              <tbody>
                {data.by_tipe.map((r) => (
                  <tr key={r.tipe}><td style={td}>{r.tipe}</td><td style={{ ...td, textAlign: "right" }}>{r.n}</td></tr>
                ))}
                {data.by_tipe.length === 0 && <tr><td style={td} colSpan={2}>Tidak ada data</td></tr>}
              </tbody>
            </table>
          </div>
          <div>
            <h4 style={{ color: sap.blue, margin: "0 0 8px" }}>Per Poli (Top)</h4>
            <table style={tableStyle}>
              <thead><tr><th style={th}>Poli</th><th style={{ ...th, textAlign: "right" }}>Jumlah</th></tr></thead>
              <tbody>
                {data.by_poli.map((r) => (
                  <tr key={r.poli}>
                    <td style={td}>
                      {r.poli}
                      <div style={{ height: 4, marginTop: 3, background: sap.blue, opacity: 0.5, width: `${(r.n / maxPoli) * 100}%`, borderRadius: 2 }} />
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>{r.n}</td>
                  </tr>
                ))}
                {data.by_poli.length === 0 && <tr><td style={td} colSpan={2}>Tidak ada data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
