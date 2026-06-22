// =====================================================================
// ItemForm.tsx — form tambah/edit master item stok
//  - create: boleh isi saldo awal (stok)
//  - edit: stok TIDAK diubah di sini (lewat gerakan stok), hanya atribut
// =====================================================================

import { useState } from "react";
import type { InvItem, InvItemInput } from "./types";
import { createItem, updateItem } from "./inventoryApi";
import { sap, inp, lbl, Btn } from "../shell/ui";

export default function ItemForm({
  editing,
  onSaved,
  onCancel,
}: {
  editing: InvItem | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!editing;
  const [f, setF] = useState<InvItemInput>({
    kode: editing?.kode ?? "",
    nama: editing?.nama ?? "",
    kategori: editing?.kategori ?? "OBAT",
    satuan: editing?.satuan ?? "PC",
    stok: editing ? Number(editing.stok) : 0,
    stok_min: editing ? Number(editing.stok_min) : 0,
    harga: editing ? Number(editing.harga) : 0,
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof InvItemInput>(k: K, v: InvItemInput[K]) {
    setF((p) => ({ ...p, [k]: v }));
  }

  async function simpan() {
    setErr("");
    setSaving(true);
    try {
      if (isEdit) await updateItem(editing!.id, f);
      else await createItem(f);
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const box: React.CSSProperties = {
    border: `1px solid ${sap.line}`,
    borderRadius: 4,
    padding: 16,
    marginBottom: 14,
    background: sap.bgZebra,
  };
  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 };

  return (
    <div style={box}>
      <h3 style={{ margin: "0 0 12px", color: sap.blue, fontSize: 16 }}>
        {isEdit ? `Edit Item — ${editing!.kode}` : "Item Baru"}
      </h3>
      {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}

      <div style={grid}>
        <div>
          <label style={lbl}>Kode *</label>
          <input
            style={{ ...inp, background: isEdit ? "#eee" : "#fff" }}
            value={f.kode}
            disabled={isEdit}
            onChange={(e) => set("kode", e.target.value)}
          />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={lbl}>Nama Item *</label>
          <input style={inp} value={f.nama} onChange={(e) => set("nama", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Kategori *</label>
          <select style={inp} value={f.kategori} onChange={(e) => set("kategori", e.target.value)}>
            <option value="OBAT">Obat</option>
            <option value="ALKES">Alkes</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Satuan</label>
          <input style={inp} value={f.satuan} onChange={(e) => set("satuan", e.target.value)} placeholder="PC / TAB / BOX" />
        </div>
        <div>
          <label style={lbl}>Stok Minimum</label>
          <input type="number" style={inp} value={f.stok_min} onChange={(e) => set("stok_min", Number(e.target.value))} />
        </div>
        {!isEdit && (
          <div>
            <label style={lbl}>Saldo Awal (Stok)</label>
            <input type="number" style={inp} value={f.stok} onChange={(e) => set("stok", Number(e.target.value))} />
          </div>
        )}
        <div>
          <label style={lbl}>Harga Satuan</label>
          <input type="number" style={inp} value={f.harga} onChange={(e) => set("harga", Number(e.target.value))} />
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
        <Btn icon="💾" primary onClick={simpan} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </Btn>
        <Btn icon="✖️" onClick={onCancel}>Batal</Btn>
      </div>
    </div>
  );
}
