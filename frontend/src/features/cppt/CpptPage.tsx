// =====================================================================
// CpptPage.tsx — Catatan Perkembangan Pasien Terintegrasi (CPPT)
//  Form tambah catatan SOAP multi-profesi + timeline catatan (terbaru dulu).
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { Cppt, CpptForm, Profesi } from "./types";
import { getCppt, createCppt, deleteCppt } from "./cpptApi";
import { getEncounters } from "../encounter/encounterApi";
import type { Encounter } from "../encounter/types";
import { Toolbar, Btn, Badge, sap, inp, lbl } from "../shell/ui";

const PROFESI: Profesi[] = ["DOKTER", "PERAWAT", "GIZI", "FARMASI", "FISIO"];
const PROF_COLOR: Record<Profesi, string> = { DOKTER: sap.blue, PERAWAT: sap.green, GIZI: sap.orange, FARMASI: "#7b4fa3", FISIO: "#0a8a8a" };

const EMPTY: CpptForm = { encounter_id: "", profesi: "DOKTER", subjektif: "", objektif: "", asesmen: "", plan: "", instruksi: "", petugas: "" };

function defaultProfesi(role: string): Profesi {
  if (role === "perawat") return "PERAWAT";
  if (role === "farmasi") return "FARMASI";
  return "DOKTER";
}

export default function CpptPage({ user }: { user: AuthUser }) {
  const canEdit = ["dokter", "perawat", "farmasi", "admin"].includes(user.role);

  const [rows, setRows] = useState<Cppt[]>([]);
  const [encs, setEncs] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CpptForm>(EMPTY);
  const [filterEnc, setFilterEnc] = useState<number | "">("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try { setRows(await getCppt()); } finally { setLoading(false); }
  }
  useEffect(() => {
    muat();
    getEncounters().then((e) => setEncs(e.filter((x) => x.status === "AKTIF"))).catch(() => {});
  }, []);

  function buka() {
    setOpen(true);
    setForm({ ...EMPTY, profesi: defaultProfesi(user.role), petugas: user.nama });
    setErr("");
  }
  function set<K extends keyof CpptForm>(k: K, v: CpptForm[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function simpan() {
    setErr("");
    if (!form.encounter_id) return setErr("Kunjungan wajib dipilih");
    if (![form.subjektif, form.objektif, form.asesmen, form.plan].some((x) => x.trim())) {
      return setErr("Minimal salah satu dari S/O/A/P harus diisi");
    }
    setSaving(true);
    try { await createCppt(form); setOpen(false); muat(); }
    catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  async function hapus(r: Cppt) {
    if (!confirm("Hapus catatan ini?")) return;
    await deleteCppt(r.id); muat();
  }

  const shown = filterEnc ? rows.filter((r) => r.encounter_id === filterEnc) : rows;

  return (
    <div>
      <Toolbar>
        {canEdit && <Btn icon="➕" primary onClick={buka}>Tambah Catatan</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <label style={{ fontSize: 12, color: sap.textSub, marginLeft: 8 }}>Filter Kunjungan:</label>
        <select style={{ ...inp, width: 260 }} value={filterEnc} onChange={(e) => setFilterEnc(e.target.value ? Number(e.target.value) : "")}>
          <option value="">(semua)</option>
          {encs.map((e) => <option key={e.id} value={e.id}>{e.encounter_no} · {e.patient_nama}</option>)}
        </select>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>{!loading && `${shown.length} catatan`}</span>
      </Toolbar>

      {open && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>📝 Catatan Terintegrasi (SOAP)</h3>
          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Kunjungan *</label>
              <select style={inp} value={form.encounter_id} onChange={(e) => set("encounter_id", e.target.value ? Number(e.target.value) : "")}>
                <option value="">- pilih kunjungan -</option>
                {encs.map((e) => <option key={e.id} value={e.id}>{e.encounter_no} · {e.patient_nama} ({e.tipe})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Profesi (PPA)</label>
              <select style={inp} value={form.profesi} onChange={(e) => set("profesi", e.target.value as Profesi)}>
                {PROFESI.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>S — Subjektif</label><textarea style={{ ...inp, minHeight: 56, fontFamily: "inherit" }} value={form.subjektif} onChange={(e) => set("subjektif", e.target.value)} /></div>
            <div><label style={lbl}>O — Objektif</label><textarea style={{ ...inp, minHeight: 56, fontFamily: "inherit" }} value={form.objektif} onChange={(e) => set("objektif", e.target.value)} /></div>
            <div><label style={lbl}>A — Asesmen</label><textarea style={{ ...inp, minHeight: 56, fontFamily: "inherit" }} value={form.asesmen} onChange={(e) => set("asesmen", e.target.value)} /></div>
            <div><label style={lbl}>P — Plan</label><textarea style={{ ...inp, minHeight: 56, fontFamily: "inherit" }} value={form.plan} onChange={(e) => set("plan", e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Instruksi / Verifikasi DPJP</label><input style={inp} value={form.instruksi} onChange={(e) => set("instruksi", e.target.value)} /></div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn icon="💾" primary onClick={simpan} disabled={saving}>{saving ? "..." : "Simpan Catatan"}</Btn>
            <Btn icon="✖️" onClick={() => setOpen(false)}>Batal</Btn>
          </div>
        </div>
      )}

      {loading ? <p>Memuat data...</p> : shown.length === 0 ? (
        <p style={{ color: sap.textSub }}>Belum ada catatan.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shown.map((r) => (
            <div key={r.id} style={{ border: `1px solid ${sap.line}`, borderLeft: `4px solid ${PROF_COLOR[r.profesi]}`, borderRadius: 4, padding: "10px 12px", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Badge text={r.profesi} color={PROF_COLOR[r.profesi]} />
                <b style={{ fontSize: 13 }}>{r.petugas ?? "-"}</b>
                <span style={{ fontSize: 12, color: sap.textSub }}>· {r.pasien_nama} ({r.encounter_no})</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: sap.textSub }}>{new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</span>
                {canEdit && <button onClick={() => hapus(r)} title="Hapus" style={{ border: "none", background: "transparent", cursor: "pointer", color: sap.red }}>🗑️</button>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px", fontSize: 13 }}>
                {r.subjektif && <div><b style={{ color: sap.textSub }}>S:</b> {r.subjektif}</div>}
                {r.objektif && <div><b style={{ color: sap.textSub }}>O:</b> {r.objektif}</div>}
                {r.asesmen && <div><b style={{ color: sap.textSub }}>A:</b> {r.asesmen}</div>}
                {r.plan && <div><b style={{ color: sap.textSub }}>P:</b> {r.plan}</div>}
              </div>
              {r.instruksi && <div style={{ fontSize: 12, marginTop: 6, color: sap.text }}><b style={{ color: sap.textSub }}>Instruksi:</b> {r.instruksi}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
