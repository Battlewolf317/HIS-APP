# Backup Database HIS — Otomatis

Script: `scripts/backup-db.js` → `npm run backup`

Hasil backup disimpan di `backend/backups/his_app_YYYYMMDD_HHmmss.sql` (rotasi: simpan 14 terbaru).

## Prasyarat
- PostgreSQL client (`pg_dump`) terinstall & ada di PATH.
- Konfigurasi koneksi dibaca dari `.env` (PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE).
- Opsi env: `BACKUP_DIR` (folder output), `BACKUP_KEEP` (jumlah file disimpan, default 14).

## Jalankan Manual
```bash
npm run backup
```

## Jadwalkan Otomatis

### Windows — Task Scheduler
1. Buka **Task Scheduler** → Create Basic Task.
2. Trigger: Daily (mis. 02:00).
3. Action: Start a program
   - Program/script: `node`
   - Arguments: `scripts/backup-db.js`
   - Start in: path folder `backend` (mis. `D:\...\his-app\backend`)
4. Simpan. Backup jalan otomatis tiap hari.

Atau pakai PowerShell sekali jalan untuk daftar task:
```powershell
schtasks /Create /SC DAILY /ST 02:00 /TN "HIS_DB_Backup" ^
  /TR "node \"D:\path\ke\his-app\backend\scripts\backup-db.js\"" /F
```

### Linux/Mac — cron
```cron
# tiap hari jam 02:00
0 2 * * * cd /path/ke/his-app/backend && /usr/bin/node scripts/backup-db.js >> backups/backup.log 2>&1
```

## Restore
```bash
psql -h localhost -U postgres -d his_app -f backups/his_app_YYYYMMDD_HHmmss.sql
```
