// =====================================================================
// scripts/backup-db.js — backup database PostgreSQL ke file ber-timestamp.
//  Pakai pg_dump (wajib ada di PATH — bagian dari PostgreSQL client).
//  Jalankan manual : node scripts/backup-db.js
//  Jadwalkan       : Windows Task Scheduler / cron (lihat README di bawah).
//
//  Konfigurasi via .env (sama dgn app): PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
//  Opsi: BACKUP_DIR (default: <backend>/backups), BACKUP_KEEP (default 14 file)
// =====================================================================

import "dotenv/config";
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const DB = process.env.PGDATABASE || "his_app";
const HOST = process.env.PGHOST || "localhost";
const PORT = process.env.PGPORT || "5432";
const USER = process.env.PGUSER || "postgres";
const PASSWORD = process.env.PGPASSWORD || "";
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(backendRoot, "backups");
const KEEP = Number(process.env.BACKUP_KEEP) || 14;

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// hapus backup lama, sisakan KEEP terbaru
function rotate() {
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith(`${DB}_`) && f.endsWith(".sql"))
    .map((f) => ({ f, t: statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const old of files.slice(KEEP)) {
    unlinkSync(path.join(BACKUP_DIR, old.f));
    console.log("🗑️  hapus backup lama:", old.f);
  }
}

function run() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const outFile = path.join(BACKUP_DIR, `${DB}_${stamp()}.sql`);

  const args = ["-h", HOST, "-p", String(PORT), "-U", USER, "-F", "p", "-f", outFile, DB];
  // pg_dump baca password dari env PGPASSWORD
  const child = spawn("pg_dump", args, { env: { ...process.env, PGPASSWORD: PASSWORD } });

  child.stderr.on("data", (d) => process.stderr.write(d));
  child.on("error", (e) => {
    console.error("❌ Gagal menjalankan pg_dump (pastikan PostgreSQL client terinstall & di PATH):", e.message);
    process.exit(1);
  });
  child.on("close", (code) => {
    if (code === 0) {
      console.log("✅ Backup sukses:", outFile);
      try { rotate(); } catch (e) { console.error("rotate gagal:", e.message); }
    } else {
      console.error(`❌ pg_dump keluar dengan kode ${code}`);
      process.exit(code || 1);
    }
  });
}

run();
