// =====================================================================
// ui.tsx — token warna + komponen UI reusable (tema healthcare modern).
// Dipakai semua modul biar tampilan konsisten & polished.
// Catatan: nama key palet dipertahankan (blue/green/orange/red/line/...)
// supaya semua halaman lama tetap kompatibel.
// =====================================================================

import type { CSSProperties, ReactNode } from "react";

// --- palet warna (modern, lembut) ---
export const sap = {
  blue: "#2469e6",
  blueDark: "#1b51b5",
  shell: "#0f2748",      // shell bar gelap (deep navy)
  line: "#e2e8f0",
  bgHead: "#f1f5f9",      // header tabel / panel
  bgZebra: "#f8fafc",
  text: "#0f172a",
  textSub: "#64748b",
  yellow: "#fef3c7",      // highlight aktif (soft)
  green: "#16a34a",
  orange: "#ea7317",
  red: "#dc2626",
};

// --- Toolbar: baris tombol aksi di atas konten ---
export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: "10px 14px",
        background: "#fff",
        border: `1px solid #eef1f6`,
        borderRadius: 14,
        marginBottom: 16,
        alignItems: "center",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      {children}
    </div>
  );
}

type BtnProps = {
  icon?: string;
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
};

// --- Tombol ---
export function Btn({ icon, children, onClick, primary, danger, type = "button", disabled }: BtnProps) {
  const cls = "hms-btn" + (primary ? " hms-btn-primary" : "");
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 13px",
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 8,
    border: `1px solid ${primary ? sap.blue : danger ? "#f1c2c2" : sap.line}`,
    background: primary ? sap.blue : "#fff",
    color: primary ? "#fff" : danger ? sap.red : sap.text,
    opacity: disabled ? 0.5 : 1,
    fontWeight: primary ? 600 : 500,
    boxShadow: primary ? "0 1px 2px rgba(36,105,230,0.3)" : "none",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style} className={cls}>
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// --- styling sel tabel ---
export const th: CSSProperties = {
  padding: "11px 14px",
  textAlign: "left",
  background: "#f8fafc",
  borderBottom: `1px solid #eef1f6`,
  fontSize: 11,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  whiteSpace: "nowrap",
};

export const td: CSSProperties = {
  padding: "11px 14px",
  borderBottom: `1px solid #f1f5f9`,
  fontSize: 13,
  color: sap.text,
};

export const tableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  border: `1px solid #eef1f6`,
  background: "#fff",
};

// --- Badge status berwarna (pill) ---
export function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 11px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: "#fff",
        background: color,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
        boxShadow: "0 1px 2px rgba(15,23,42,0.10)",
      }}
    >
      {text}
    </span>
  );
}

// --- Kartu generik (panel) ---
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="hms-card"
      style={{
        background: "#fff",
        border: `1px solid #eef1f6`,
        borderRadius: 16,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.04)",
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// --- Kartu statistik (KPI) ---
export function StatCard({ label, value, sub, color, icon }: { label: string; value: ReactNode; sub?: string; color?: string; icon?: string }) {
  const c = color ?? sap.blue;
  return (
    <div
      className="hms-card"
      style={{
        flex: 1,
        minWidth: 150,
        background: "#fff",
        border: `1px solid #eef1f6`,
        borderRadius: 18,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.05)",
        padding: "16px 18px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 10.5, color: sap.textSub, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{label}</div>
        {icon && (
          <span style={{ width: 30, height: 30, borderRadius: 10, background: hexA(c, 0.12), display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: c, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: sap.textSub, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// helper: warna hex + alpha → rgba
function hexA(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- input & label standar ---
export const inp: CSSProperties = {
  padding: "8px 11px",
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid #dfe5ec`,
  borderRadius: 9,
  fontSize: 13,
  background: "#fff",
  color: sap.text,
};

export const lbl: CSSProperties = {
  fontSize: 12,
  color: sap.textSub,
  display: "block",
  marginBottom: 4,
  fontWeight: 600,
};
