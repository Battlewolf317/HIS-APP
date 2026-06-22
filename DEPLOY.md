# Deploy his-app — Railway (backend + DB) + Vercel (frontend)

Folder ini adalah **salinan deploy-ready** dari his-app. Versi lokal di
`HIS Exploration/his-app/` TIDAK diubah dan tetap untuk pengembangan lokal.

Perbedaan dari versi lokal:
- `backend/src/config/db.js` → mendukung `DATABASE_URL` + SSL (Postgres terkelola).
- `frontend/src/lib/api.ts` → `BASE_URL` dari `VITE_API_BASE` (fallback localhost).
- Tambahan: `.env.example`, `Procfile`, `vercel.json`, `vite-env.d.ts`, `.gitignore`.

> ⚠️ DEMO ONLY. App ini punya user seed dengan password mudah ditebak
> (admin123, dll) dan belum di-hardening penuh. Jangan masukkan data pasien asli.

---

## Langkah Deploy

### 1) Push ke GitHub
Push folder `his-app-deploy` sebagai repo (atau subfolder repo).

```bash
cd "HIS Exploration/his-app-deploy"
git init
git add .
git commit -m "his-app deploy-ready"
git branch -M main
git remote add origin https://github.com/USERNAME/his-app.git
git push -u origin main
```

### 2) Database — Neon (atau Railway Postgres)
1. Buat project di https://neon.tech → buat database.
2. Salin **connection string** (format `postgresql://...?sslmode=require`).
   Ini nilai `DATABASE_URL`.

> Alternatif: di Railway bisa langsung "Add Postgres" dan pakai `DATABASE_URL`
> yang otomatis tersedia di service backend.

### 3) Backend — Railway
1. https://railway.app → New Project → Deploy from GitHub repo.
2. Set **Root Directory** = `backend` (jika repo berisi backend+frontend).
3. Railway auto-detect Node (script `npm start`). `Procfile` juga tersedia.
4. Tambah **Environment Variables**:
   - `DATABASE_URL` = connection string Neon/Railway
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = string acak panjang (min 16 char)
   - `CORS_ORIGINS` = URL frontend Vercel (isi setelah langkah 4, lalu redeploy)
5. Deploy. Saat boot, `initDb()` otomatis membuat tabel + seed user demo.
6. Catat domain backend, mis. `https://his-app-backend.up.railway.app`.

> Tabel + seed dibuat otomatis pada start pertama — tidak perlu migrasi manual.

### 4) Frontend — Vercel
1. https://vercel.com → New Project → import repo yang sama.
2. Set **Root Directory** = `frontend`.
3. Framework otomatis terdeteksi **Vite** (lihat `vercel.json`).
4. Tambah **Environment Variable**:
   - `VITE_API_BASE` = `https://his-app-backend.up.railway.app/api`
     (domain backend Railway + `/api`)
5. Deploy → dapat URL, mis. `https://his-app.vercel.app`.

### 5) Tutup loop CORS
1. Balik ke Railway → set `CORS_ORIGINS` = URL Vercel (`https://his-app.vercel.app`).
2. Redeploy backend.

### 6) Tes
Buka URL Vercel → login user demo:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| dokter | dokter123 | Dokter |
| perawat | perawat123 | Perawat |
| kasir | kasir123 | Kasir |
| farmasi | farmasi123 | Apoteker |
| gudang | gudang123 | Gudang |
| lab | lab123 | Analis Lab |
| radiologi | radiologi123 | Radiografer |

---

## Catatan

- **Render** bisa jadi alternatif Railway: buat "Web Service" (root `backend`,
  start `npm start`) + "PostgreSQL", set env yang sama.
- Free tier backend bisa "tidur" saat idle → request pertama agak lambat (cold start).
- Untuk produksi nyata: aktifkan HTTPS penuh, ganti password seed, enkripsi
  at-rest, dan ikuti `KEPATUHAN_SERTIFIKASI_SIMRS.md`.
