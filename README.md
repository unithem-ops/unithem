# e-Kesihatan & Wabak SAGA

Source code asas Next.js untuk pembinaan semula sistem e-Kesihatan SAGA.

## Fungsi yang sudah tersedia
- Senarai rekod kes
- Tambah rekod
- Sunting rekod
- Padam rekod
- Tarikh cuti sakit mula / tamat
- Bukti dokumen melalui URL
- Sambungan dua hala ke Google Sheets melalui Google Apps Script

## Sambungan Google Apps Script
1. Salin kandungan `Code.gs` ke Apps Script yang terikat dengan Google Sheet.
2. Deploy sebagai Web App.
3. Tetapkan `NEXT_PUBLIC_APPS_SCRIPT_URL` pada Vercel kepada URL Web App tersebut.

> Konfigurasi Vercel dikemas kini untuk menggunakan endpoint Apps Script melalui environment variable.
