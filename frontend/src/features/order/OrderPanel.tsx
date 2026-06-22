import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type { Encounter } from "../encounter/types";
import type { ClinicalOrder } from "./types";
import { getOrders, createOrder, selesaiOrder, batalOrder } from "./orderApi";
import { sap, Btn, Badge, inp, lbl } from "../shell/ui";

type Props = {
  encounter: Encounter;
  role: string;
  onClose: () => void;
};

const rupiah = (n: number | string) =>
  "Rp " + Number(n).toLocaleString("id-ID", { minimumFractionDigits: 0 });

const STATUS_COLOR: Record<string, string> = { PENDING: sap.orange, DONE: sap.green, BATAL: sap.red };
const KOSONG = { jenis: "LAB", deskripsi: "", harga: "" };

export default function OrderPanel({ encounter, role, onClose }: Props) {
  const [orders, setOrders] = useState<ClinicalOrder[]>([]);
  const [form, setForm] = useState(KOSONG);
  const [error, setError] = useState("");

  const aktif = encounter.status === "AKTIF";
  const bisaOrder = aktif && (role === "dokter" || role === "admin");

  async function muat() {
    setOrders(await getOrders(encounter.id));
  }

  useEffect(() => {
    muat();
    setForm(KOSONG);
    setError("");
  }, [encounter.id]);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await createOrder({
        encounter_id: encounter.id,
        jenis: form.jenis,
        deskripsi: form.deskripsi,
        harga: Number(form.harga) || 0,
      });
      setForm(KOSONG);
      muat();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function selesai(o: ClinicalOrder) {
    const hasil = prompt(`Hasil untuk "${o.deskripsi}":`, o.hasil ?? "");
    if (hasil === null) return;
    try {
      await selesaiOrder(o.id, hasil);
      muat();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function batal(o: ClinicalOrder) {
    if (!confirm(`Batalkan order "${o.deskripsi}"?`)) return;
    try {
      await batalOrder(o.id);
      muat();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div style={panelWrap}>
      <div style={panelHead}>
        <h3 style={panelTitle}>
          🧾 Order / CPOE — {encounter.encounter_no}
          <span style={subTitle}> ({encounter.patient_nama})</span>
        </h3>
        <Btn icon="✕" onClick={onClose}>Tutup</Btn>
      </div>

      <div style={panelBody}>
        {/* FORM buat order (dokter/admin, kunjungan AKTIF) */}
        {bisaOrder ? (
          <form onSubmit={tambah} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={lbl}>Jenis</label>
              <select style={{ ...inp, width: 130 }} value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })}>
                <option value="LAB">Lab</option>
                <option value="RAD">Radiologi</option>
                <option value="RESEP">Resep</option>
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={lbl}>Deskripsi</label>
              <input style={inp} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Harga (estimasi)</label>
              <input style={{ ...inp, width: 120 }} type="number" min={0} value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} />
            </div>
            <Btn type="submit" primary icon="➕">Order</Btn>
          </form>
        ) : (
          <p style={infoStyle}>
            {aktif ? "Hanya dokter yang bisa membuat order." : `Kunjungan ${encounter.status} — order read-only.`}
          </p>
        )}
        {error && <p style={errStyle}>⚠️ {error}</p>}

        {/* DAFTAR order */}
        <h4 style={sectionTitle}>Daftar Order ({orders.length})</h4>
        {orders.length === 0 ? (
          <p style={{ color: sap.textSub }}>Belum ada order.</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span><b>[{o.jenis}]</b> {o.deskripsi} — {rupiah(o.harga)}</span>
                <Badge text={o.status} color={STATUS_COLOR[o.status] ?? sap.textSub} />
              </div>
              {o.hasil && <div style={{ color: sap.textSub, marginTop: 4 }}>Hasil: {o.hasil}</div>}
              {o.status === "PENDING" && (
                <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                  <Btn icon="✓" onClick={() => selesai(o)}>Selesai / Isi Hasil</Btn>
                  <Btn danger icon="✕" onClick={() => batal(o)}>Batal</Btn>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- style panel bergaya SAP ---
const panelWrap: CSSProperties = {
  border: `1px solid ${sap.line}`,
  borderTop: `3px solid ${sap.blue}`,
  borderRadius: 4,
  marginBottom: 20,
  background: "#fff",
  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
};
const panelHead: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  background: sap.bgHead,
  borderBottom: `1px solid ${sap.line}`,
};
const panelTitle: CSSProperties = { margin: 0, fontSize: 15, color: sap.text };
const subTitle: CSSProperties = { color: sap.textSub, fontWeight: 400, fontSize: 13 };
const panelBody: CSSProperties = { padding: 14 };
const sectionTitle: CSSProperties = { margin: "16px 0 6px", fontSize: 13, color: sap.textSub, textTransform: "uppercase", letterSpacing: 0.3 };
const cardStyle: CSSProperties = { border: `1px solid ${sap.line}`, borderRadius: 4, padding: 10, marginBottom: 8, fontSize: 13, background: sap.bgZebra };
const errStyle: CSSProperties = { color: sap.red, margin: "8px 0 0" };
const infoStyle: CSSProperties = { color: sap.textSub, fontStyle: "italic" };
