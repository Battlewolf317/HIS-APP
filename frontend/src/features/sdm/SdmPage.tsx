// =====================================================================
// SdmPage.tsx — SDM / Kepegawaian
//  Tab Pegawai (master + CRUD) | Presensi (per tanggal, isi kehadiran).
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { Pegawai, PegawaiForm, Presensi, PresensiForm, PegawaiStatus, PresensiStatus } from "./types";
import { getPegawai, createPegawai, updatePegawai, getPresensi, savePresensi } from "./sdmApi";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const PEG_COLOR: Record<PegawaiStatus, string> = { AKTIF: sap.green, NONAKTIF: sap.textSub };
const PRES_COLOR: Record<PresensiStatus, string> = { HADIR: sap.green, IZIN: sap.blue, SAKIT: sap.orange, ALPA: sap.red, CUTI: "#5b738b" };
const PRES_STATUS: PresensiStatus[] = ["HADIR", "IZIN", "SAKIT", "ALPA", "CUTI"];
const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_PEG: PegawaiForm = { nip: "", nama: "", jabatan: "", unit: "", no_hp: "", status: "AKTIF" };
const EMPTY_PRES: PresensiForm = { pegawai_id: "", tanggal: today(), jam_masuk: "", jam_pulang: "", status: "HADIR", catatan: "" };

export default function SdmPage({ user }: { user: AuthUser }) {
  const canEdit = user.role === "admin";
  const [tab, setTab] = useState<"pegawai" | "presensi">("pegawai");

  const tabBtn = (key: "pegawai" | "presensi", text: string) => (
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
        {tabBtn("pegawai", "Pegawai")}
        {tabBtn("presensi", "Presensi")}
      </div>
      {tab === "pegawai" ? <PegawaiTab canEdit={canEdit} /> : <PresensiTab canEdit={canEdit} />}
    </div>
  );
}

// ---------------- TAB PEGAWAI ----------------
function PegawaiTab({ canEdit }: { canEdit: boolean }) {
  const [rows, setRows] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<PegawaiForm>(EMPTY_PEG);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try { setRows(await getPegawai()); } finally { setLoading(false); }
  }
  useEffect(() => { muat(); }, []);

  function tambah() { setEditId("new"); setForm(EMPTY_PEG); setErr(""); }
  function edit(p: Pegawai) {
    setEditId(p.id);
    setForm({ nip: p.nip, nama: p.nama, jabatan: p.jabatan ?? "", unit: p.unit ?? "", no_hp: p.no_hp ?? "", status: p.status });
    setErr("");
  }
  function set<K extends keyof PegawaiForm>(k: K, v: PegawaiForm[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function simpan() {
    setErr("");
    if (!form.nip.trim()) return setErr("NIP wajib diisi");
    if (!form.nama.trim()) return setErr("Nama wajib diisi");
    setSaving(true);
    try {
      if (editId === "new") await createPegawai(form);
      else if (typeof editId === "number") await updatePegawai(editId, form);
      setEditId(null);
      muat();
    } catch (e) { setErr((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <div>
      <Toolbar>
        {canEdit && <Btn icon="➕" primary onClick={tambah}>Tambah Pegawai</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>{!loading && `${rows.length} pegawai`}</span>
      </Toolbar>

      {editId !== null && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>👤 {editId === "new" ? "Pegawai Baru" : "Ubah Pegawai"}</h3>
          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>NIP *</label><input style={inp} value={form.nip} onChange={(e) => set("nip", e.target.value)} disabled={editId !== "new"} /></div>
            <div><label style={lbl}>Nama *</label><input style={inp} value={form.nama} onChange={(e) => set("nama", e.target.value)} /></div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp} value={form.status} onChange={(e) => set("status", e.target.value as PegawaiStatus)}>
                <option value="AKTIF">AKTIF</option><option value="NONAKTIF">NONAKTIF</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><label style={lbl}>Jabatan</label><input style={inp} value={form.jabatan} onChange={(e) => set("jabatan", e.target.value)} /></div>
            <div><label style={lbl}>Unit</label><input style={inp} value={form.unit} onChange={(e) => set("unit", e.target.value)} /></div>
            <div><label style={lbl}>No. HP</label><input style={inp} value={form.no_hp} onChange={(e) => set("no_hp", e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn icon="💾" primary onClick={simpan} disabled={saving}>{saving ? "..." : "Simpan"}</Btn>
            <Btn icon="✖️" onClick={() => setEditId(null)}>Batal</Btn>
          </div>
        </div>
      )}

      {loading ? <p>Memuat data...</p> : (
        <table style={tableStyle}>
          <thead><tr><th style={th}>NIP</th><th style={th}>Nama</th><th style={th}>Jabatan</th><th style={th}>Unit</th><th style={th}>Status</th><th style={th}>Aksi</th></tr></thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{p.nip}</td>
                <td style={td}>{p.nama}</td>
                <td style={td}>{p.jabatan ?? "-"}</td>
                <td style={td}>{p.unit ?? "-"}</td>
                <td style={td}><Badge text={p.status} color={PEG_COLOR[p.status]} /></td>
                <td style={td}>{canEdit ? <Btn icon="✏️" onClick={() => edit(p)}>Ubah</Btn> : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---------------- TAB PRESENSI ----------------
function PresensiTab({ canEdit }: { canEdit: boolean }) {
  const [tanggal, setTanggal] = useState(today());
  const [rows, setRows] = useState<Presensi[]>([]);
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<PresensiForm>({ ...EMPTY_PRES });
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try { setRows(await getPresensi(tanggal)); } finally { setLoading(false); }
  }
  useEffect(() => { muat(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tanggal]);
  useEffect(() => { getPegawai().then((p) => setPegawai(p.filter((x) => x.status === "AKTIF"))).catch(() => {}); }, []);

  function buka() { setOpen(true); setForm({ ...EMPTY_PRES, tanggal }); setErr(""); }
  function set<K extends keyof PresensiForm>(k: K, v: PresensiForm[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function simpan() {
    setErr("");
    if (!form.pegawai_id) return setErr("Pegawai wajib dipilih");
    setSaving(true);
    try {
      await savePresensi(form);
      setOpen(false);
      muat();
    } catch (e) { setErr((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <div>
      <Toolbar>
        <label style={{ fontSize: 12, color: sap.textSub }}>Tanggal:</label>
        <input style={{ ...inp, width: 160 }} type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        {canEdit && <Btn icon="➕" primary onClick={buka}>Input Presensi</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>{!loading && `${rows.length} presensi`}</span>
      </Toolbar>

      {open && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>🕒 Input Presensi — {form.tanggal}</h3>
          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Pegawai *</label>
              <select style={inp} value={form.pegawai_id} onChange={(e) => set("pegawai_id", e.target.value ? Number(e.target.value) : "")}>
                <option value="">- pilih pegawai -</option>
                {pegawai.map((p) => <option key={p.id} value={p.id}>{p.nip} · {p.nama}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp} value={form.status} onChange={(e) => set("status", e.target.value as PresensiStatus)}>
                {PRES_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Jam Masuk</label><input style={inp} type="time" value={form.jam_masuk} onChange={(e) => set("jam_masuk", e.target.value)} /></div>
            <div><label style={lbl}>Jam Pulang</label><input style={inp} type="time" value={form.jam_pulang} onChange={(e) => set("jam_pulang", e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Catatan</label><input style={inp} value={form.catatan} onChange={(e) => set("catatan", e.target.value)} /></div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn icon="💾" primary onClick={simpan} disabled={saving}>{saving ? "..." : "Simpan"}</Btn>
            <Btn icon="✖️" onClick={() => setOpen(false)}>Batal</Btn>
          </div>
        </div>
      )}

      {loading ? <p>Memuat data...</p> : rows.length === 0 ? (
        <p style={{ color: sap.textSub }}>Belum ada presensi untuk tanggal ini.</p>
      ) : (
        <table style={tableStyle}>
          <thead><tr><th style={th}>NIP</th><th style={th}>Nama</th><th style={th}>Unit</th><th style={th}>Masuk</th><th style={th}>Pulang</th><th style={th}>Status</th><th style={th}>Catatan</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{r.nip}</td>
                <td style={td}>{r.pegawai_nama}</td>
                <td style={td}>{r.unit ?? "-"}</td>
                <td style={td}>{r.jam_masuk ?? "-"}</td>
                <td style={td}>{r.jam_pulang ?? "-"}</td>
                <td style={td}><Badge text={r.status} color={PRES_COLOR[r.status]} /></td>
                <td style={td}>{r.catatan ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
