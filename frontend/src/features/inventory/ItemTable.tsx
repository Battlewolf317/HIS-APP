// =====================================================================
// ItemTable.tsx — tabel master item stok (gaya SAP grid padat)
// =====================================================================

import type { InvItem } from "./types";
import { th, td, tableStyle, sap, Btn, Badge } from "../shell/ui";

type Props = {
  items: InvItem[];
  canManage: boolean;
  onEdit: (it: InvItem) => void;
  onDelete: (it: InvItem) => void;
  onStock: (it: InvItem) => void;
};

const fmtQty = (v: string) => Number(v).toLocaleString("id-ID");
const fmtRp = (v: string) => "Rp " + Number(v).toLocaleString("id-ID");

export default function ItemTable({ items, canManage, onEdit, onDelete, onStock }: Props) {
  if (items.length === 0) return <p style={{ color: sap.textSub }}>Tidak ada item.</p>;

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={th}>Kode</th>
          <th style={th}>Nama Item</th>
          <th style={th}>Kategori</th>
          <th style={{ ...th, textAlign: "right" }}>Stok</th>
          <th style={th}>Satuan</th>
          <th style={{ ...th, textAlign: "right" }}>Min</th>
          <th style={{ ...th, textAlign: "right" }}>Harga</th>
          <th style={th}>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it, i) => {
          const low = Number(it.stok) <= Number(it.stok_min);
          return (
            <tr key={it.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
              <td style={{ ...td, fontFamily: "monospace" }}>{it.kode}</td>
              <td style={td}>{it.nama}</td>
              <td style={td}>
                <Badge text={it.kategori} color={it.kategori === "OBAT" ? sap.blue : sap.orange} />
              </td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700, color: low ? sap.red : sap.text }}>
                {fmtQty(it.stok)} {low && "⚠"}
              </td>
              <td style={td}>{it.satuan}</td>
              <td style={{ ...td, textAlign: "right", color: sap.textSub }}>{fmtQty(it.stok_min)}</td>
              <td style={{ ...td, textAlign: "right" }}>{fmtRp(it.harga)}</td>
              <td style={{ ...td, whiteSpace: "nowrap" }}>
                <Btn icon="📋" onClick={() => onStock(it)}>Kartu Stok</Btn>{" "}
                {canManage && (
                  <>
                    <Btn icon="✏️" onClick={() => onEdit(it)}>Edit</Btn>{" "}
                    <Btn icon="🗑️" danger onClick={() => onDelete(it)}>Hapus</Btn>
                  </>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
