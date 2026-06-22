// =====================================================================
// PharmacyPage.tsx — Farmasi / Dispensing resep
//  List resep PENDING → pilih → dispense (pilih obat dari inventory + qty)
//  → potong stok + order DONE (auto-billing).
// =====================================================================

import { useState, useEffect } from "react";
import type { PendingResep } from "./types";
import { getPendingResep, dispense } from "./pharmacyApi";
import { getItems } from "../inventory/inventoryApi";
import type { InvItem } from "../inventory/types";
import { Toolbar, Btn, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

export default function PharmacyPage({ role }: { role: string }) {
  const canDispense = role === "farmasi" || role === "admin";

  const [resep, setResep] = useState<PendingResep[]>([]);
  const [obat, setObat] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [sel, setSel] = useState<PendingResep | null>(null);
  const [itemId, setItemId] = useState(0);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try {
      const [r, o] = await Promise.all([getPendingResep(), getItems("", "OBAT")]);
      setResep(r);
      setObat(o);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []);

  function pilih(r: PendingResep) {
    setSel(r);
    setItemId(0);
    setQty(1);
    setErr("");
  }

  async function proses() {
    if (!sel) return;
    setErr("");
    if (!itemId) {
      setErr("Pilih obat dulu");
      return;
    }
    setSaving(true);
    try {
      await dispense({ order_id: sel.id, item_id: itemId, qty: Number(qty) });
      setSel(null);
      muat();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const fmtRp = (v: string) => "Rp " + Number(v).toLocaleString("id-ID");

  return (
    <div>
      <Toolbar>
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${resep.length} resep menunggu`}
        </span>
      </Toolbar>

      {sel && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>
            Dispense Resep #{sel.id} — {sel.pasien}
          </h3>
          <div style={{ fontSize: 13, marginBottom: 10 }}>
            <b>Resep:</b> {sel.deskripsi} &nbsp;·&nbsp; <b>Kunjungan:</b> {sel.encounter_no}
          </div>
          {err && <div style={{ color: sap.red, marginBottom: 8, fontSize: 13 }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={lbl}>Obat (dari stok)</label>
              <select style={inp} value={itemId} onChange={(e) => setItemId(Number(e.target.value))}>
                <option value={0}>-- pilih obat --</option>
                {obat.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.kode} — {o.nama} (stok {Number(o.stok).toLocaleString("id-ID")} {o.satuan})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Qty Dispense</label>
              <input type="number" style={inp} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {canDispense && (
                <Btn icon="💊" primary onClick={proses} disabled={saving}>
                  {saving ? "..." : "Dispense"}
                </Btn>
              )}
              <Btn icon="✖️" onClick={() => setSel(null)}>Batal</Btn>
            </div>
          </div>
          <div style={{ fontSize: 11, color: sap.textSub, marginTop: 8 }}>
            Dispense akan memotong stok obat & menutup resep (status DONE).
          </div>
        </div>
      )}

      {loading ? (
        <p>Memuat data...</p>
      ) : resep.length === 0 ? (
        <p style={{ color: sap.textSub }}>Tidak ada resep menunggu.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>No. Resep</th>
              <th style={th}>Pasien (MRN)</th>
              <th style={th}>Kunjungan</th>
              <th style={th}>Deskripsi Resep</th>
              <th style={{ ...th, textAlign: "right" }}>Harga</th>
              <th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {resep.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>#{r.id}</td>
                <td style={td}>{r.pasien} ({r.mrn})</td>
                <td style={td}>{r.encounter_no}</td>
                <td style={td}>{r.deskripsi}</td>
                <td style={{ ...td, textAlign: "right" }}>{fmtRp(r.harga)}</td>
                <td style={td}>
                  <Btn icon="💊" onClick={() => pilih(r)}>Dispense</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
