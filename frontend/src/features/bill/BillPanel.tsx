import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type { Encounter } from "../encounter/types";
import type { Bill } from "./types";
import { getBill, addItem, removeItem, bayar, addPayment } from "./billApi";
import { sap, Btn, Badge, inp, lbl, th, td, tableStyle } from "../shell/ui";

type Props = {
  encounter: Encounter;
  role: string;
  onClose: () => void;
};

const rupiah = (n: number | string) =>
  "Rp " + Number(n).toLocaleString("id-ID", { minimumFractionDigits: 0 });

const KOSONG = { deskripsi: "", qty: "1", harga: "" };
const BAYAR_KOSONG = { jenis: "BAYAR", metode: "TUNAI", jumlah: "", keterangan: "" };

const METODE = ["TUNAI", "DEBIT", "KREDIT", "TRANSFER", "BPJS", "ASURANSI"];
const JENIS_COLOR: Record<string, string> = { BAYAR: sap.green, DEPOSIT: sap.blue, REFUND: sap.red };

export default function BillPanel({ encounter, role, onClose }: Props) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [form, setForm] = useState(KOSONG);
  const [pay, setPay] = useState(BAYAR_KOSONG);
  const [error, setError] = useState("");

  async function muat() {
    setBill(await getBill(encounter.id));
  }

  useEffect(() => {
    muat();
    setForm(KOSONG);
    setPay(BAYAR_KOSONG);
    setError("");
  }, [encounter.id]);

  const lunas = bill?.status === "LUNAS";
  const bisaBayar = role === "kasir" || role === "admin";

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!bill) return;
    try {
      const updated = await addItem(bill.id, {
        deskripsi: form.deskripsi,
        qty: Number(form.qty),
        harga: Number(form.harga),
      });
      setBill(updated);
      setForm(KOSONG);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function hapus(itemId: number) {
    if (!bill) return;
    setBill(await removeItem(itemId));
  }

  async function catatBayar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!bill) return;
    try {
      const updated = await addPayment(bill.id, {
        jenis: pay.jenis,
        metode: pay.metode,
        jumlah: Number(pay.jumlah),
        keterangan: pay.keterangan,
      });
      setBill(updated);
      setPay(BAYAR_KOSONG);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function lunasiTunai() {
    if (!bill) return;
    if (!confirm(`Lunasi sisa ${rupiah(bill.sisa)} secara tunai?`)) return;
    setError("");
    try {
      setBill(await bayar(bill.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!bill) return null;

  return (
    <div style={panelWrap}>
      <div style={panelHead}>
        <h3 style={panelTitle}>
          💰 Tagihan — {encounter.encounter_no}
          <span style={subTitle}> ({encounter.patient_nama})</span>
          <span style={{ marginLeft: 10 }}>
            <Badge text={bill.status} color={lunas ? sap.green : sap.orange} />
          </span>
        </h3>
        <Btn icon="✕" onClick={onClose}>Tutup</Btn>
      </div>

      <div style={panelBody}>
        {/* TABEL ITEM */}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>Deskripsi</th>
              <th style={{ ...th, textAlign: "right" }}>Qty</th>
              <th style={{ ...th, textAlign: "right" }}>Harga</th>
              <th style={{ ...th, textAlign: "right" }}>Subtotal</th>
              {!lunas && <th style={{ ...th, width: 40 }}></th>}
            </tr>
          </thead>
          <tbody>
            {bill.items.length === 0 ? (
              <tr><td style={td} colSpan={5}>Belum ada item.</td></tr>
            ) : (
              bill.items.map((it, i) => (
                <tr key={it.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                  <td style={td}>{it.deskripsi}</td>
                  <td style={{ ...td, textAlign: "right" }}>{it.qty}</td>
                  <td style={{ ...td, textAlign: "right" }}>{rupiah(it.harga)}</td>
                  <td style={{ ...td, textAlign: "right" }}>{rupiah(it.subtotal)}</td>
                  {!lunas && (
                    <td style={{ ...td, textAlign: "center" }}>
                      <button onClick={() => hapus(it.id)} title="Hapus item"
                        style={{ cursor: "pointer", color: sap.red, fontSize: 13, border: "none", background: "none" }}>✕</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: sap.bgHead }}>
              <td style={{ ...td, fontWeight: 700 }} colSpan={3}>TOTAL</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700, color: sap.blue }}>{rupiah(bill.total)}</td>
              {!lunas && <td style={td}></td>}
            </tr>
          </tfoot>
        </table>

        {/* FORM tambah item (kalau belum LUNAS) */}
        {!lunas && (
          <form onSubmit={tambah} style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input style={{ ...inp, flex: 2, minWidth: 180 }} placeholder="Deskripsi item" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
            <input style={{ ...inp, width: 70 }} type="number" min={1} placeholder="Qty" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
            <input style={{ ...inp, width: 120 }} type="number" min={0} placeholder="Harga" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} />
            <Btn type="submit" icon="➕">Item</Btn>
          </form>
        )}

        {/* RINGKASAN PEMBAYARAN */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <SummaryBox label="Total" value={rupiah(bill.total)} color={sap.text} />
          <SummaryBox label="Terbayar" value={rupiah(bill.terbayar)} color={sap.green} />
          <SummaryBox label="Sisa" value={rupiah(bill.sisa)} color={bill.sisa > 0 ? sap.orange : sap.green} />
        </div>

        {/* RIWAYAT PEMBAYARAN */}
        {bill.payments.length > 0 && (
          <>
            <h4 style={sectionTitle}>Riwayat Pembayaran ({bill.payments.length})</h4>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={th}>Waktu</th>
                  <th style={th}>Jenis</th>
                  <th style={th}>Metode</th>
                  <th style={{ ...th, textAlign: "right" }}>Jumlah</th>
                  <th style={th}>Keterangan</th>
                  <th style={th}>Kasir</th>
                </tr>
              </thead>
              <tbody>
                {bill.payments.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                    <td style={td}>{new Date(p.created_at).toLocaleString("id-ID")}</td>
                    <td style={td}><Badge text={p.jenis} color={JENIS_COLOR[p.jenis] ?? sap.textSub} /></td>
                    <td style={td}>{p.metode}</td>
                    <td style={{ ...td, textAlign: "right", color: p.jenis === "REFUND" ? sap.red : sap.text }}>
                      {p.jenis === "REFUND" ? "-" : ""}{rupiah(p.jumlah)}
                    </td>
                    <td style={td}>{p.keterangan || "-"}</td>
                    <td style={td}>{p.kasir || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* AKSI KASIR */}
        {lunas ? (
          <p style={{ color: sap.green, marginTop: 14, fontWeight: 600 }}>
            ✅ LUNAS — dibayar {bill.paid_at ? new Date(bill.paid_at).toLocaleString("id-ID") : ""}
          </p>
        ) : bisaBayar ? (
          <>
            <h4 style={sectionTitle}>Catat Pembayaran</h4>
            <form onSubmit={catatBayar} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={lbl}>Jenis</label>
                <select style={{ ...inp, width: 120 }} value={pay.jenis} onChange={(e) => setPay({ ...pay, jenis: e.target.value })}>
                  <option value="BAYAR">Bayar</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="REFUND">Refund</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Metode</label>
                <select style={{ ...inp, width: 130 }} value={pay.metode} onChange={(e) => setPay({ ...pay, metode: e.target.value })}>
                  {METODE.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Jumlah</label>
                <input style={{ ...inp, width: 130 }} type="number" min={0} value={pay.jumlah} onChange={(e) => setPay({ ...pay, jumlah: e.target.value })} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={lbl}>Keterangan</label>
                <input style={inp} value={pay.keterangan} onChange={(e) => setPay({ ...pay, keterangan: e.target.value })} />
              </div>
              <Btn type="submit" icon="💾">Catat</Btn>
            </form>
            <div style={{ marginTop: 12 }}>
              <Btn primary icon="💳" onClick={lunasiTunai}>Lunasi Sisa (Tunai)</Btn>
            </div>
          </>
        ) : (
          <p style={infoStyle}>Hanya kasir yang bisa memproses pembayaran.</p>
        )}

        {error && <p style={errStyle}>⚠️ {error}</p>}
      </div>
    </div>
  );
}

function SummaryBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 140, border: `1px solid ${sap.line}`, borderRadius: 4, padding: "8px 12px", background: sap.bgZebra }}>
      <div style={{ fontSize: 11, color: sap.textSub, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
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
const errStyle: CSSProperties = { color: sap.red, margin: "8px 0 0" };
const infoStyle: CSSProperties = { color: sap.textSub, fontStyle: "italic", marginTop: 14 };
