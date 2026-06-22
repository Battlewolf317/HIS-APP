// =====================================================================
// StockCard.tsx — kartu stok 1 item (riwayat gerakan) + form IN/OUT/ADJ
//  Tampil sebagai panel overlay di atas konten.
// =====================================================================

import { useState, useEffect } from "react";
import type { InvItem, InvMovement } from "./types";
import { getMovements, createMovement } from "./inventoryApi";
import { th, td, tableStyle, sap, inp, lbl, Btn, Badge } from "../shell/ui";

const fmtQty = (v: string | number) => Number(v).toLocaleString("id-ID");
const tipeColor: Record<string, string> = { IN: sap.green, OUT: sap.red, ADJ: sap.orange };

export default function StockCard({
  item,
  canManage,
  onClose,
  onChanged,
}: {
  item: InvItem;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [moves, setMoves] = useState<InvMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stok, setStok] = useState(Number(item.stok));

  const [tipe, setTipe] = useState("IN");
  const [qty, setQty] = useState(0);
  const [ref, setRef] = useState("");
  const [ket, setKet] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try {
      setMoves(await getMovements(item.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function simpan() {
    setErr("");
    setSaving(true);
    try {
      const m = await createMovement({ item_id: item.id, tipe, qty: Number(qty), ref, keterangan: ket });
      setStok(Number(m.stok_after));
      setQty(0);
      setRef("");
      setKet("");
      await muat();
      onChanged(); // refresh tabel master (stok berubah)
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 50,
    zIndex: 50,
  };
  const panel: React.CSSProperties = {
    background: "#fff",
    width: 720,
    maxWidth: "94%",
    maxHeight: "85vh",
    overflow: "auto",
    borderRadius: 6,
    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
    padding: 18,
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{ margin: 0, color: sap.blue, fontSize: 16 }}>
            📋 Kartu Stok — {item.kode}
          </h3>
          <Btn icon="✖️" onClick={onClose}>Tutup</Btn>
        </div>
        <div style={{ fontSize: 13, color: sap.textSub, marginBottom: 12 }}>
          {item.nama} · Satuan {item.satuan} · Stok saat ini:{" "}
          <b style={{ color: sap.text, fontSize: 15 }}>{fmtQty(stok)}</b> {item.satuan}
        </div>

        {canManage && (
          <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 12, marginBottom: 14, background: sap.bgZebra }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: sap.text }}>Catat Gerakan Stok</div>
            {err && <div style={{ color: sap.red, marginBottom: 8, fontSize: 13 }}>{err}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "120px 110px 1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={lbl}>Tipe</label>
                <select style={inp} value={tipe} onChange={(e) => setTipe(e.target.value)}>
                  <option value="IN">IN (Masuk)</option>
                  <option value="OUT">OUT (Keluar)</option>
                  <option value="ADJ">ADJ (Opname)</option>
                </select>
              </div>
              <div>
                <label style={lbl}>{tipe === "ADJ" ? "Stok Fisik" : "Qty"}</label>
                <input type="number" style={inp} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              </div>
              <div>
                <label style={lbl}>Referensi</label>
                <input style={inp} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="No. faktur / dok" />
              </div>
              <div>
                <label style={lbl}>Keterangan</label>
                <input style={inp} value={ket} onChange={(e) => setKet(e.target.value)} />
              </div>
              <Btn icon="💾" primary onClick={simpan} disabled={saving}>
                {saving ? "..." : "Catat"}
              </Btn>
            </div>
            {tipe === "ADJ" && (
              <div style={{ fontSize: 11, color: sap.textSub, marginTop: 6 }}>
                ADJ = stock opname: stok di-set sama dengan nilai fisik yang diinput.
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p>Memuat riwayat...</p>
        ) : moves.length === 0 ? (
          <p style={{ color: sap.textSub }}>Belum ada gerakan stok.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={th}>Tanggal</th>
                <th style={th}>Tipe</th>
                <th style={{ ...th, textAlign: "right" }}>Qty</th>
                <th style={{ ...th, textAlign: "right" }}>Sebelum</th>
                <th style={{ ...th, textAlign: "right" }}>Sesudah</th>
                <th style={th}>Ref</th>
                <th style={th}>Oleh</th>
              </tr>
            </thead>
            <tbody>
              {moves.map((m, i) => (
                <tr key={m.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                  <td style={td}>{new Date(m.created_at).toLocaleString("id-ID")}</td>
                  <td style={td}><Badge text={m.tipe} color={tipeColor[m.tipe] ?? sap.textSub} /></td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{fmtQty(m.qty)}</td>
                  <td style={{ ...td, textAlign: "right", color: sap.textSub }}>{fmtQty(m.stok_before)}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{fmtQty(m.stok_after)}</td>
                  <td style={td}>{m.ref || "-"}</td>
                  <td style={td}>{m.created_by || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
