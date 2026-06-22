// =====================================================================
// app.js — ENTRY POINT backend HIS
// Rakit: middleware + routes tiap modul → nyalakan server
// =====================================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./config/db.js";
import { authenticate } from "./middleware/auth.js";
import { securityHeaders, makeRateLimiter } from "./middleware/security.js";
import { auditLog } from "./middleware/audit.js";
import { ALLOWED_ORIGINS } from "./config/security.js";

// import routes tiap modul
import authRoutes from "./modules/auth/auth.routes.js";
import patientRoutes from "./modules/patient/patient.routes.js";
import encounterRoutes from "./modules/encounter/encounter.routes.js";
import icd10Routes from "./modules/icd10/icd10.routes.js";
import medrecRoutes from "./modules/medrec/medrec.routes.js";
import billRoutes from "./modules/bill/bill.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import pharmacyRoutes from "./modules/pharmacy/pharmacy.routes.js";
import diagnosticRoutes from "./modules/diagnostic/diagnostic.routes.js";
import bedRoutes from "./modules/bed/bed.routes.js";
import reportRoutes from "./modules/report/report.routes.js";
import queueRoutes from "./modules/queue/queue.routes.js";
import masterRoutes from "./modules/master/master.routes.js";
import claimRoutes from "./modules/claim/claim.routes.js";
import accountingRoutes from "./modules/accounting/accounting.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import triaseRoutes from "./modules/triase/triase.routes.js";
import dietRoutes from "./modules/diet/diet.routes.js";
import rujukanRoutes from "./modules/rujukan/rujukan.routes.js";
import operasiRoutes from "./modules/operasi/operasi.routes.js";
import dpjpRoutes from "./modules/dpjp/dpjp.routes.js";
import dischargeRoutes from "./modules/discharge/discharge.routes.js";
import jasamedisRoutes from "./modules/jasamedis/jasamedis.routes.js";
import procurementRoutes from "./modules/procurement/procurement.routes.js";
import sdmRoutes from "./modules/sdm/sdm.routes.js";
import laporanRoutes from "./modules/laporan/laporan.routes.js";
import fisioterapiRoutes from "./modules/fisioterapi/fisioterapi.routes.js";
import mcuRoutes from "./modules/mcu/mcu.routes.js";
import transfusiRoutes from "./modules/transfusi/transfusi.routes.js";
import profilRoutes from "./modules/profil/profil.routes.js";
import asistenRoutes from "./modules/asisten/asisten.routes.js";
import cpptRoutes from "./modules/cppt/cppt.routes.js";
import askepRoutes from "./modules/askep/askep.routes.js";
import consentRoutes from "./modules/consent/consent.routes.js";

const app = express();

// --- P16 Hardening ---
app.disable("x-powered-by");
app.set("trust proxy", 1);                          // hormati X-Forwarded-For (di belakang proxy)
app.use(securityHeaders);                            // header keamanan (anti clickjacking/sniff)
app.use(cors({ origin: ALLOWED_ORIGINS }));          // CORS dibatasi ke origin frontend
app.use(express.json({ limit: "1mb" }));             // batasi ukuran payload
app.use("/api", makeRateLimiter({ windowMs: 60_000, max: 300 })); // limit umum API
app.use(auditLog);                                   // catat mutasi ke audit_log

// limiter ketat khusus login (anti brute-force)
const loginLimiter = makeRateLimiter({ windowMs: 60_000, max: 10, message: "Terlalu banyak percobaan login, coba lagi 1 menit." });

// cek (public)
app.get("/", (req, res) => res.send("HIS App backend jalan!"));

// auth = public (login). /me butuh token (dicek di dalam router)
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);

// SEMUA modul di bawah ini WAJIB login (authenticate).
// Role spesifik (mis. dokter/kasir) dicek di masing-masing routes modul.
app.use("/api/patients", authenticate, patientRoutes);
app.use("/api/encounters", authenticate, encounterRoutes);
app.use("/api/icd10", authenticate, icd10Routes);
app.use("/api/medical-records", authenticate, medrecRoutes);
app.use("/api/bills", authenticate, billRoutes);
app.use("/api/orders", authenticate, orderRoutes);
app.use("/api/inventory", authenticate, inventoryRoutes);
app.use("/api/pharmacy", authenticate, pharmacyRoutes);
app.use("/api/diagnostic", authenticate, diagnosticRoutes);
app.use("/api/beds", authenticate, bedRoutes);
app.use("/api/reports", authenticate, reportRoutes);
app.use("/api/queue", authenticate, queueRoutes);
app.use("/api/master", authenticate, masterRoutes);
app.use("/api/claims", authenticate, claimRoutes);
app.use("/api/accounting", authenticate, accountingRoutes);
app.use("/api/audit", authenticate, auditRoutes);
app.use("/api/triase", authenticate, triaseRoutes);
app.use("/api/diet", authenticate, dietRoutes);
app.use("/api/rujukan", authenticate, rujukanRoutes);
app.use("/api/operasi", authenticate, operasiRoutes);
app.use("/api/dpjp", authenticate, dpjpRoutes);
app.use("/api/discharge", authenticate, dischargeRoutes);
app.use("/api/jasamedis", authenticate, jasamedisRoutes);
app.use("/api/procurement", authenticate, procurementRoutes);
app.use("/api/sdm", authenticate, sdmRoutes);
app.use("/api/laporan", authenticate, laporanRoutes);
app.use("/api/fisioterapi", authenticate, fisioterapiRoutes);
app.use("/api/mcu", authenticate, mcuRoutes);
app.use("/api/transfusi", authenticate, transfusiRoutes);
app.use("/api/profil", authenticate, profilRoutes);
app.use("/api/asisten", authenticate, asistenRoutes);
app.use("/api/cppt", authenticate, cpptRoutes);
app.use("/api/askep", authenticate, askepRoutes);
app.use("/api/consent", authenticate, consentRoutes);

const PORT = process.env.PORT || 3001;

// siapkan DB dulu, baru nyalakan server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ HIS App backend jalan di http://localhost:${PORT} (DB: his_app)`);
    });
  })
  .catch((err) => {
    console.error("❌ Gagal init database:", err.message);
  });
