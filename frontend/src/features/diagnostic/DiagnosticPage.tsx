// =====================================================================
// DiagnosticPage.tsx — Worklist penunjang (dipakai Lab LIS & Radiologi RIS)
//  jenis = 'LAB' atau 'RAD'. Worklist PENDING → input hasil → DONE (+auto-billing).
//  Tab: Worklist (PENDING) | Sudah Selesai (DONE).
// =====================================================================

import { useState, useEffect } from "react";
import type { DiagOrder } from "./types";
import { getWorklist, getDone, submitResult } from "./diagnosticApi";
import { Toolbar, Btn, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

export default function DiagnosticPage({
  jenis,
  role,
}: {
  jenis: "LAB" | "RAD";
  role: string;
}) {
  const label = jenis === "LAB" ? "Laboratorium" : "Radiologi";
  const canResult = role === (jenis === "LAB" ? "lab" : "radiologi") || role === "admin";

  const [tab, setTab] = useState<"pending" | "done">("pending");
  const [rows, setRows] = useState<DiagOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [sel, setSel] = useState<DiagOrder | null>(null);
  const [hasil, setHasil] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try {
      setRows(tab === "pending" ? await getWorklist(jenis) : await getDone(jenis));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
    setSel(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, jenis]);

  function pilih(r: DiagOrder) {
    setSel(r);
    setHasil(r.hasil ?? "");
    setErr("");
  }

  async function simpan() {
    if (!sel) return;
    setErr("");
    if (!hasil.trim()) {
      setErr("Hasil pemeriksaan wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await submitResult(sel.id, hasil);
      setSel(null);
      muat();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const tabBtn = (key: "pending" | "done", text: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        padding: "6px 14px",
        fontSize: 13,
        cursor: "pointer",
        border: `1px solid ${sap.line}`,
        borderBottom: tab === key ? `2px solid ${sap.blue}` : `1px solid ${sap.line}`,
        background: tab === key ? "#fff" : sap.bgHead,
        color: tab === key ? sap.blue : sap.text,
        fontWeight: tab === key ? 700 : 400,
      }}
    >
      {text}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
        {tabBtn("pending", "Worklist (Menunggu)")}
        {tabBtn("done", "Sudah Selesai")}
      </div>

      <Toolbar>
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${rows.length} order ${label}`}
        </span>
      </Toolbar>

      {sel && tab === "pending" && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>
            Input Hasil {label} — Order #{sel.id} ({sel.pasien})
          </h3>
          <div style={{ fontSize: 13, marginBottom: 10 }}>
            <b>Pemeriksaan:</b> {sel.deskripsi} &nbsp;·&nbsp; <b>Kunjungan:</b> {sel.encounter_no}
          </div>
          {err && <div style={{ color: sap.red, marginBottom: 8, fontSize: 13 }}>{err}</div>}
          <label style={lbl}>Hasil Pemeriksaan</label>
          <textarea
            style={{ ...inp, minHeight: 90, fontFamily: "inherit" }}
            value={hasil}
            onChange={(e) => setHasil(e.target.value)}
            placeholder={jenis === "LAB" ? "Mis. Hb 13.5 g/dL; Leukosit 8.000/uL ..." : "Mis. Kesan: tidak tampak kelainan ..."}
          />
          <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
            {canResult && (
              <Btn icon="💾" primary onClick={simpan} disabled={saving}>
                {saving ? "..." : "Simpan Hasil & Selesai"}
              </Btn>
            )}
            <Btn icon="✖️" onClick={() => setSel(null)}>Batal</Btn>
          </div>
          <div style={{ fontSize: 11, color: sap.textSub, marginTop: 8 }}>
            Simpan hasil akan menutup order (DONE) & masuk tagihan otomatis bila ada harga.
          </div>
        </div>
      )}

      {loading ? (
        <p>Memuat data...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: sap.textSub }}>
          {tab === "pending" ? `Tidak ada order ${label} menunggu.` : "Belum ada hasil selesai."}
        </p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>Order</th>
              <th style={th}>Pasien (MRN)</th>
              <th style={th}>Kunjungan</th>
              <th style={th}>Pemeriksaan</th>
              {tab === "done" ? <th style={th}>Hasil</th> : <th style={th}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>#{r.id}</td>
                <td style={td}>{r.pasien} ({r.mrn})</td>
                <td style={td}>{r.encounter_no}</td>
                <td style={td}>{r.deskripsi}</td>
                {tab === "done" ? (
                  <td style={{ ...td, whiteSpace: "pre-wrap" }}>{r.hasil}</td>
                ) : (
                  <td style={td}>
                    <Btn icon="🔬" onClick={() => pilih(r)}>Input Hasil</Btn>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
