import { useState } from "react";
import type { WorkEnv, PageKey } from "./menuConfig";
import type { AuthUser } from "../../lib/api";
import { sap } from "./ui";

type Props = {
  env: WorkEnv;
  user: AuthUser;
  active: PageKey;
  onSelect: (key: PageKey) => void;
  onLogout: () => void;
};

export default function Sidebar({ env, user, active, onSelect, onLogout }: Props) {
  // default: semua grup ter-collapse, KECUALI grup yang berisi menu aktif.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of env.groups) {
      init[g.title] = !g.items.some((it) => it.key === active);
    }
    return init;
  });
  const toggle = (title: string) => setCollapsed((c) => ({ ...c, [title]: !c[title] }));
  return (
    <aside
      style={{
        width: 256,
        minWidth: 256,
        background: "#fff",
        borderRight: `1px solid ${sap.line}`,
        display: "flex",
        flexDirection: "column",
        fontSize: 13,
        boxShadow: "1px 0 3px rgba(15,23,42,0.04)",
      }}
    >
      {/* Header work environment */}
      <div style={{ background: `linear-gradient(135deg, ${sap.blue} 0%, ${sap.blueDark} 100%)`, color: "#fff", padding: "12px 14px" }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{env.label}</div>
        <div style={{ fontSize: 11, opacity: 0.85 }}>[{env.code}]</div>
      </div>

      <div style={{ padding: "10px 14px 4px", color: sap.textSub, fontWeight: 700, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.6 }}>
        Work Environment
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "0 6px" }}>
        {env.groups.map((g) => {
          const isCollapsed = collapsed[g.title];
          // grup dianggap aktif kalau salah satu itemnya sedang dibuka
          const hasActive = g.items.some((it) => it.key === active);
          return (
            <div key={g.title} style={{ marginBottom: 4 }}>
              <button
                onClick={() => toggle(g.title)}
                className="hms-nav-group"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 8px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: "#334155",
                  textAlign: "left",
                  borderRadius: 8,
                }}
                title={isCollapsed ? "Buka" : "Tutup"}
              >
                <span style={{ fontSize: 9, color: sap.textSub, width: 10, display: "inline-block" }}>
                  {isCollapsed ? "▶" : "▼"}
                </span>
                <span style={{ color: "#caa84b" }}>{isCollapsed ? "📁" : "📂"}</span>
                <span style={{ flex: 1 }}>{g.title}</span>
                {isCollapsed && hasActive && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: sap.blue }} />
                )}
              </button>
              {!isCollapsed &&
                g.items.map((it) => {
                  const isActive = active === it.key;
                  return (
                    <button
                      key={it.key}
                      onClick={() => onSelect(it.key)}
                      className="hms-nav-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        width: "100%",
                        textAlign: "left",
                        padding: "7px 10px 7px 24px",
                        margin: "1px 0",
                        cursor: "pointer",
                        border: "none",
                        borderRadius: 8,
                        background: isActive ? "#e8f0fe" : "transparent",
                        color: isActive ? sap.blueDark : "#475569",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 12.5,
                        borderLeft: isActive ? `3px solid ${sap.blue}` : "3px solid transparent",
                      }}
                    >
                      <span style={{ fontSize: 11, opacity: 0.7 }}>{isActive ? "🔹" : "•"}</span>
                      {it.label}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </nav>

      <div style={{ borderTop: `1px solid ${sap.line}`, padding: "12px 14px", background: sap.bgZebra }}>
        <div style={{ fontWeight: 700 }}>{user.nama}</div>
        <div style={{ color: sap.blue, fontWeight: 600, textTransform: "uppercase", fontSize: 11 }}>{user.role}</div>
        <button
          onClick={onLogout}
          className="hms-btn"
          style={{ marginTop: 8, cursor: "pointer", fontSize: 12, width: "100%", padding: 7, border: `1px solid ${sap.line}`, borderRadius: 8, background: "#fff", fontWeight: 600, color: sap.text }}
        >
          ⏻ Logout
        </button>
      </div>
    </aside>
  );
}
