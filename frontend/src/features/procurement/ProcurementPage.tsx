// =====================================================================
// ProcurementPage.tsx — Procurement (pengadaan PR/PO)
//  Buat PR (supplier + item lines) → ajukan → setujui (admin) →
//  terima barang (stok inv_item bertambah otomatis). Detail + aksi status.
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { Purchase, Supplier, PurchaseForm, LineInput, PurchaseStatus } from "./types";
import { getSuppliers, getPurchases, getPurchase, createPurchase, purchaseAction } from "./procurementApi";
import { getItems } from "../inventory/inventoryApi";
import type { InvItem } from "../inventory/types";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const STATUS_COLOR: Record<PurchaseStatus, string> = {
  DRAFT: sap.textSub, DIAJUKAN: sap.orange, DISETUJUI: sap.blue, DITERIMA: sap.green, BATAL: sap.red,
};
const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");
const EMPTY_LINE: LineInput = { item_id: "", qty: "", harga: "" };

export default function ProcurementPage({ user }: { user: AuthUser }) {
  const isGudang = user.role === "gudang" || user.role === "admin";
  const isApprover = user.role === "admin";

  const [rows, setRows] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<PurchaseForm>({ supplier_id: "", keterangan: "", items: [{ ...EMPTY_LINE }] });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<Purchase | null>(null);

  async function muat() {
    setLoading(true);
    try {
      setRows(await getPurchases());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
    getSuppliers().then(setSuppliers).catch(() => {});
    getItems().then(setItems).catch(() => {});
  }, []);

  function bukaForm() {
    setCreating(true);
    setDetail(null);
    setForm({ supplier_id: "", keterangan: "", items: [{ ...EMPTY_LINE }] });
    setErr("");
  }

  function setLine(idx: number, patch: Partial<LineInput>) {
    setForm((f) => ({ ...f, items: f.items.map((l, i) => (i === idx ? { ...l, ...patch } : l)) }));
  }
  function addLine() {
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_LINE }] }));
  }
  function removeLine(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  // saat pilih item, auto-isi harga default dari master
  function pilihItem(idx: number, itemId: string) {
    const it = items.find((x) => x.id === Number(itemId));
    setLine(idx, { item_id: itemId ? Number(itemId) : "", harga: it ? String(Number(it.harga)) : "" });
  }

  const formTotal = form.items.reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.harga) || 0), 0);

  async function simpan() {
    setErr("");
    if (!form.supplier_id) return setErr("Supplier wajib dipilih");
    const valid = form.items.filter((l) => l.item_id && Number(l.qty) > 0);
    if (valid.length === 0) return setErr("Minimal 1 item dengan qty > 0");
    setSaving(true);
    try {
      await createPurchase({ ...form, items: valid });
      setCreating(false);
      muat();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function lihatDetail(id: number) {
    setCreating(false);
    setDetail(await getPurchase(id));
  }

  async function aksi(id: number, action: "submit" | "approve" | "receive" | "cancel") {
    try {
      const updated = await purchaseAction(id, action);
      setDetail(updated);
      muat();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div>
      <Toolbar>
        {isGudang && <Btn icon="➕" primary onClick={bukaForm}>Buat Pengadaan (PR)</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${rows.length} dokumen`}
        </span>
      </Toolbar>

      {/* FORM BUAT PR */}
      {creating && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>📦 Pengadaan Baru (PR)</h3>
          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Supplier *</label>
              <select style={inp} value={form.supplier_id} onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value ? Number(e.target.value) : "" }))}>
                <option value="">- pilih supplier -</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Keterangan</label>
              <input style={inp} value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))} />
            </div>
          </div>

          <label style={lbl}>Item Barang</label>
          <table style={{ ...tableStyle, marginBottom: 8 }}>
            <thead>
              <tr>
                <th style={th}>Item</th>
                <th style={{ ...th, width: 90 }}>Qty</th>
                <th style={{ ...th, width: 120 }}>Harga</th>
                <th style={{ ...th, width: 120 }}>Subtotal</th>
                <th style={{ ...th, width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((l, i) => (
                <tr key={i}>
                  <td style={td}>
                    <select style={inp} value={l.item_id} onChange={(e) => pilihItem(i, e.target.value)}>
                      <option value="">- pilih item -</option>
                      {items.map((it) => <option key={it.id} value={it.id}>{it.kode} · {it.nama}</option>)}
                    </select>
                  </td>
                  <td style={td}><input style={inp} type="number" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} /></td>
                  <td style={td}><input style={inp} type="number" value={l.harga} onChange={(e) => setLine(i, { harga: e.target.value })} /></td>
                  <td style={{ ...td, textAlign: "right" }}>{rupiah((Number(l.qty) || 0) * (Number(l.harga) || 0))}</td>
                  <td style={td}>{form.items.length > 1 && <Btn icon="🗑️" danger onClick={() => removeLine(i)}> </Btn>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Btn icon="➕" onClick={addLine}>Tambah Baris</Btn>
            <span style={{ marginLeft: "auto", fontWeight: 700, color: sap.blue }}>Total: {rupiah(formTotal)}</span>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <Btn icon="💾" primary onClick={simpan} disabled={saving}>{saving ? "..." : "Simpan PR"}</Btn>
            <Btn icon="✖️" onClick={() => setCreating(false)}>Batal</Btn>
          </div>
        </div>
      )}

      {/* DETAIL DOKUMEN */}
      {detail && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <h3 style={{ margin: 0, color: sap.blue, fontSize: 16 }}>{detail.no_dok}</h3>
            <Badge text={detail.status} color={STATUS_COLOR[detail.status]} />
            <span style={{ marginLeft: "auto" }}><Btn icon="✖️" onClick={() => setDetail(null)}>Tutup</Btn></span>
          </div>
          <div style={{ fontSize: 13, marginBottom: 10 }}>
            <b>Supplier:</b> {detail.supplier_nama ?? "-"} &nbsp;·&nbsp; <b>Diminta:</b> {detail.requested_by ?? "-"}
            {detail.approved_by && <> &nbsp;·&nbsp; <b>Disetujui:</b> {detail.approved_by}</>}
            {detail.keterangan && <> &nbsp;·&nbsp; {detail.keterangan}</>}
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={th}>Item</th>
                <th style={{ ...th, textAlign: "right" }}>Qty</th>
                <th style={{ ...th, textAlign: "right" }}>Harga</th>
                <th style={{ ...th, textAlign: "right" }}>Subtotal</th>
                <th style={{ ...th, textAlign: "right" }}>Diterima</th>
              </tr>
            </thead>
            <tbody>
              {detail.items?.map((it) => (
                <tr key={it.id}>
                  <td style={td}>{it.item_kode} · {it.item_nama} <span style={{ color: sap.textSub, fontSize: 11 }}>({it.satuan})</span></td>
                  <td style={{ ...td, textAlign: "right" }}>{Number(it.qty)}</td>
                  <td style={{ ...td, textAlign: "right" }}>{rupiah(Number(it.harga))}</td>
                  <td style={{ ...td, textAlign: "right" }}>{rupiah(Number(it.subtotal))}</td>
                  <td style={{ ...td, textAlign: "right" }}>{Number(it.qty_terima)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ ...td, fontWeight: 700, textAlign: "right" }} colSpan={3}>Total</td>
                <td style={{ ...td, fontWeight: 700, textAlign: "right", color: sap.blue }}>{rupiah(Number(detail.total))}</td>
                <td style={td}></td>
              </tr>
            </tfoot>
          </table>

          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {isGudang && detail.status === "DRAFT" && <Btn icon="📤" primary onClick={() => aksi(detail.id, "submit")}>Ajukan</Btn>}
            {isApprover && detail.status === "DIAJUKAN" && <Btn icon="✅" primary onClick={() => aksi(detail.id, "approve")}>Setujui</Btn>}
            {isGudang && detail.status === "DISETUJUI" && <Btn icon="📥" primary onClick={() => aksi(detail.id, "receive")}>Terima Barang (Stok Masuk)</Btn>}
            {isGudang && detail.status !== "DITERIMA" && detail.status !== "BATAL" && <Btn icon="🚫" danger onClick={() => aksi(detail.id, "cancel")}>Batalkan</Btn>}
          </div>
        </div>
      )}

      {loading ? (
        <p>Memuat data...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: sap.textSub }}>Belum ada dokumen pengadaan.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>No. Dokumen</th>
              <th style={th}>Supplier</th>
              <th style={{ ...th, textAlign: "right" }}>Item</th>
              <th style={{ ...th, textAlign: "right" }}>Total</th>
              <th style={th}>Status</th>
              <th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{r.no_dok}</td>
                <td style={td}>{r.supplier_nama ?? "-"}</td>
                <td style={{ ...td, textAlign: "right" }}>{r.jml_item ?? 0}</td>
                <td style={{ ...td, textAlign: "right" }}>{rupiah(Number(r.total))}</td>
                <td style={td}><Badge text={r.status} color={STATUS_COLOR[r.status]} /></td>
                <td style={td}><Btn icon="🔍" onClick={() => lihatDetail(r.id)}>Detail</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
