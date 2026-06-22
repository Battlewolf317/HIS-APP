import { useState } from "react";
import { login } from "./authApi";
import { setToken, setUser, type AuthUser } from "../../lib/api";
import { inp, lbl, sap } from "../shell/ui";

type Props = { onLogin: (user: AuthUser) => void };

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token, user } = await login(username, password);
      setToken(token);
      setUser(user);
      onLogin(user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${sap.shell} 0%, ${sap.blue} 100%)`,
      }}
    >
      <form onSubmit={submit} style={{ background: "#fff", borderRadius: 8, width: 360, boxShadow: "0 8px 30px rgba(0,0,0,.25)", overflow: "hidden" }}>
        {/* header bar */}
        <div style={{ background: sap.shell, color: "#fff", padding: "16px 24px" }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>🏥 HIS</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Hospital Information System</div>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Username</label>
            <input style={inp} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Password</label>
            <input style={inp} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <p style={{ color: sap.red, margin: "0 0 12px", fontSize: 13 }}>⚠️ {error}</p>}

          <button
            type="submit"
            disabled={busy}
            style={{ width: "100%", padding: 11, background: sap.blue, color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 15 }}
          >
            {busy ? "Masuk..." : "Login"}
          </button>

          <div style={{ fontSize: 11, color: sap.textSub, marginTop: 16, lineHeight: 1.7, borderTop: `1px solid ${sap.line}`, paddingTop: 10 }}>
            <b>Demo login:</b><br />
            admin / admin123 &nbsp;·&nbsp; dokter / dokter123<br />
            perawat / perawat123 &nbsp;·&nbsp; kasir / kasir123
          </div>
        </div>
      </form>
    </div>
  );
}
