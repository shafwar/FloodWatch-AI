FLOODWATCH SEMARANG
===================

FloodWatch Semarang adalah aplikasi web berbasis AI untuk membantu masyarakat
memantau cuaca dan risiko banjir di Kota Semarang. Aplikasi ini mengambil data
cuaca dari BMKG, menghitung skor risiko banjir, menampilkannya di peta interaktif
(WebGIS), lalu menerjemahkan hasil tersebut menjadi penjelasan bahasa manusia
melalui asisten AI **AQUA Assistant**.

Proyek ini dibuat sebagai prototype awal. Fokus MVP saat ini masih terbatas pada
10 titik pantau kelurahan di Kota Semarang dengan empat level risiko:

- AMAN
- WASPADA
- SIAGA
- BAHAYA


TUJUAN PRODUK
=============

Dalam kehidupan sehari-hari, data cuaca dan peringatan dini sebenarnya sudah
tersedia dari BMKG. Namun, informasi tersebut masih sering berbentuk data mentah
atau peta teknis yang sulit dipahami masyarakat awam dengan cepat.

FloodWatch Semarang mencoba menjembatani masalah tersebut dengan alur sederhana:

1. Pengguna membuka dashboard dan melihat ringkasan cuaca + peta.
2. Pengguna bertanya ke AQUA Assistant, misalnya: "Cuaca Semarang Utara gimana?"
3. Sistem mendeteksi lokasi dari pertanyaan dan menghitung skor risiko banjir.
4. Aplikasi membuka peta penuh dengan animasi analisis dan badge risiko.
5. AQUA Assistant menjawab dengan data yang sama dengan hasil di peta.
6. Jika risiko meningkat, alert otomatis muncul di Alert Center.


FITUR UTAMA
===========

- Dashboard utama dengan AQUA Assistant (chat AI) dan mini peta.
- Peta interaktif WebGIS berbasis Leaflet untuk 10 titik pantau kelurahan.
- Marker berwarna dengan angka skor risiko per lokasi.
- Alur analisis lokasi: chat → peta → overlay analisis → badge risiko → jawaban AI.
- Mesin risiko banjir rule-based (transparan, bukan tebakan AI).
- Integrasi data BMKG API dengan fallback dataset CSV lokal.
- Pembaruan data otomatis pada batas slot 3 jam BMKG.
- Interval refresh data dapat diatur dari halaman Settings.
- Alert Center otomatis saat risiko ≥ WASPADA atau kondisi hujan terdeteksi.
- Halaman Analytics: grafik suhu, kelembapan, distribusi risiko, dan kondisi cuaca.
- Halaman Riwayat: trend risiko per jam dan data historis.
- Jam real-time WIB di TopNav.
- UI responsif dengan dark theme dan animasi transisi halus.
- Deployment production di Vercel.


TECH STACK
==========

Framework
---------
Next.js 16
Digunakan sebagai framework React untuk routing multi-halaman, API Routes,
server-side data fetching ke BMKG, dan workflow deployment ke Vercel.

UI Library
----------
React 19
Digunakan untuk membangun antarmuka interaktif berbasis komponen.

Bahasa
------
TypeScript
Digunakan untuk memberi type-safety pada data cuaca, skor risiko, state global,
dan respons API.

Styling
-------
Tailwind CSS 4
Digunakan untuk membangun UI responsif dengan pendekatan utility-first.

State Management
----------------
Zustand
Digunakan untuk state global: cuaca, chat, peta, alert, dashboard, dan UI settings.

Data Fetching
-------------
TanStack React Query + custom hooks
Digunakan untuk sinkronisasi data cuaca dan polling interval refresh.

Peta / WebGIS
-------------
Leaflet
Digunakan untuk menampilkan peta interaktif, marker risiko, fly-to lokasi,
dan mode analisis dari chat.

Grafik
------
Recharts
Digunakan untuk visualisasi suhu, kelembapan, distribusi risiko, dan trend di
halaman Analytics dan Riwayat.

Animasi
-------
Framer Motion
Digunakan untuk transisi overlay analisis, panel chat, dan animasi UI.

AI Assistant
------------
Google Gemini API
Digunakan sebagai LLM untuk AQUA Assistant — menerjemahkan data cuaca JSON
menjadi jawaban bahasa natural bagi pengguna akhir.

Icon
----
Lucide React
Digunakan sebagai sistem ikon ringan untuk navigasi, chart, dan komponen UI.

Deployment
----------
Vercel (region Singapore — sin1)
Digunakan sebagai platform deployment production.


ALASAN PEMILIHAN TEKNOLOGI
==========================

1. Next.js
----------

Next.js dipilih karena cocok untuk prototype WebGIS yang tetap punya jalur
produksi jelas. FloodWatch membutuhkan server-side API Routes untuk:

- Fetch data BMKG tanpa masalah CORS di browser.
- Menjalankan Gemini API dengan API key yang aman di server.
- Menyajikan halaman dashboard, peta, analytics, dan alert dalam satu aplikasi.

Keuntungan teknis:

- Struktur proyek rapi untuk React dan TypeScript.
- API Routes sebagai middleware/proxy ke BMKG.
- Build dan optimasi aset terintegrasi.
- Integrasi deployment ke Vercel sangat sederhana.
- App Router mendukung multi-halaman: /dashboard, /map, /analytics, /alerts,
  /history, /settings.

Tradeoff Next.js:

- Lebih kompleks dibanding SPA sederhana untuk aplikasi kecil.
- Leaflet membutuhkan client component karena akses DOM — tidak bisa full SSR
  pada komponen peta.
- Beberapa state interaktif (chat flow, overlay transisi) harus dikelola di
  sisi client.


2. Vercel
---------

Vercel dipilih karena workflow deployment Next.js sangat langsung:

- Deploy cepat dari repository GitHub.
- Environment variable untuk GEMINI_API_KEY aman di server.
- URL demo mudah dibagikan untuk presentasi tugas besar.
- Region Singapore (sin1) untuk latency lebih rendah ke Indonesia.

Live Demo: https://floodwatch-semarang.vercel.app

Tradeoff Vercel:

- Fetch BMKG dari server Vercel bisa kena rate limit jika traffic tinggi.
- Serverless function timeout membatasi durasi fetch paralel ke 10 lokasi.
- Dataset CSV fallback diperlukan agar demo tetap berjalan saat BMKG offline.


3. Leaflet
----------

Leaflet dipilih sebagai pustaka peta open-source yang ringan dan stabil untuk
prototype WebGIS.

Alasan teknis:

- Tidak membutuhkan API key berbayar (berbeda dengan Mapbox).
- Custom marker berwarna sesuai skor risiko mudah diimplementasikan.
- Fly-to animasi untuk fokus lokasi dari chat.
- Cocok untuk 10 titik pantau tanpa performa berat.

Tradeoff Leaflet:

- Tidak sekaya fitur bawaan Mapbox GL (3D, vector tile premium).
- Popup dan overlay perlu dikelola manual agar tidak bentrok saat mode analisis.
- Harus di-render sebagai client component di Next.js.


4. Google Gemini API
--------------------

Gemini dipilih sebagai otak percakapan AQUA Assistant.

Alasan teknis:

- Gratis untuk tier development/demo.
- Mendukung system instruction untuk mencegah halusinasi data cuaca.
- Dapat menerima konteks JSON data BMKG sebagai input terstruktur.
- Model fallback chain: gemini-2.5-flash → gemini-2.5-flash-lite → gemini-2.0-flash-lite.

Penting: Gemini TIDAK menghitung skor risiko. Skor dihitung oleh floodRiskEngine
di server/client, lalu Gemini hanya merangkai penjelasan dalam bahasa manusia.

Tradeoff Gemini:

- Dapat halusinasi jika system prompt lemah — perlu validasi manual.
- Bergantung pada koneksi internet dan kuota API.
- Data BMKG slot 3 jam, bukan prediksi per menit — perlu dijelaskan ke pengguna.


5. Zustand
----------

Zustand dipilih untuk state global yang ringan dan mudah dipahami.

Alasan teknis:

- Lebih sederhana daripada Redux untuk prototype.
- Cocok untuk chat flow, sesi analisis peta, dan data cuaca.
- Mudah di-subscribe dari hooks dan komponen React.

Tradeoff Zustand:

- Tidak se-terstruktur Redux DevTools untuk aplikasi sangat besar.
- State persistence (localStorage) belum diimplementasikan di prototype ini.


6. Rule-Based Flood Risk Engine
-------------------------------

Mesin risiko tidak menggunakan machine learning. Pendekatan rule-based dipilih
agar hasil transparan dan dapat dijelaskan ke pengguna/dosen.

Alasan teknis:

- Skor dapat diverifikasi manual dari kondisi cuaca + kelembapan.
- Tidak membutuhkan dataset banjir historis yang lengkap untuk MVP.
- Hasil konsisten antara peta, alert, analytics, dan jawaban AI.

Tradeoff:

- Tidak mempertimbangkan topografi, drainase, atau riwayat banjir aktual.
- Skor adalah estimasi potensi risiko dari cuaca, bukan prediksi banjir pasti.


ARSITEKTUR APLIKASI
===================

FloodWatch memakai arsitektur hybrid: server-side untuk data & AI, client-side
untuk peta dan interaksi pengguna.

Diagram alur:

Pengguna
  |
  v
Browser (React + Zustand)
  |
  +---> /api/weather  ---> BMKG API (10 lokasi adm4)
  |         |                      |
  |         | (gagal/offline)      v
  |         +------------> CSV Fallback (dataset lokal)
  |         |
  |         v
  |    weatherStore (records + meta)
  |         |
  |         v
  |    floodRiskEngine (skor 0-100, level AMAN-BAHAYA)
  |         |
  |         +---> FloodMap (marker berwarna)
  |         +---> Alert Center (generateAlert)
  |         +---> Analytics / History charts
  |
  +---> /api/chat ---> buildSystemPrompt + Gemini API
            |
            v
       AQUA Assistant (jawaban bahasa natural)


ALUR ANALISIS LOKASI DARI CHAT
==============================

Alur khusus saat pengguna menyebut lokasi di chat:

1. User mengirim pesan, misalnya: "Cuaca Semarang Utara gimana?"
2. queryParser mendeteksi lokasi dan timeFrame (now / forecast).
3. computeLocationRisk menghitung skor dari data weatherStore.
4. chatFlowStore.beginMapAnalysis menyimpan sesi analisis.
5. router.replace('/map') — navigasi ke halaman peta.
6. MapAnalysisRunner mengorkestrasi fase:
   - scanning   : pan peta ke lokasi (tanpa overlay loading)
   - analyzing  : overlay loading "Menganalisis risiko banjir"
   - result     : badge AMAN/WASPADA/SIAGA/BAHAYA di tengah peta
   - returning  : kembali ke dashboard, inject jawaban AI ke chat
7. fetch /api/chat berjalan paralel dengan mapResult agar jawaban AI
   sinkron dengan badge di peta.

Diagram fase analisis:

chat (lokasi terdeteksi)
  |
  v
hitung risiko + simpan sesi analisis
  |
  v
navigasi ke /map
  |
  v
scanning (pan peta, ~3.2 detik)
  |
  v
analyzing (overlay loading, tunggu API Gemini)
  |
  v
result (tampilkan badge risiko, ~2.2 detik)
  |
  v
inject jawaban AI ke chat
  |
  v
returning (overlay transisi kembali)
  |
  v
dashboard (clearAnalysis)


ALUR STATE APLIKASI
===================

State utama dikelola melalui Zustand stores:

1. weatherStore
   Data cuaca BMKG/CSV, meta (source, bmkgStatus, activeSlot), fetchWeather().

2. chatFlowStore
   Pesan chat, sesi analisis peta, fase (scanning/analyzing/result/returning),
   flag isNavigatingToMap.

3. mapStore
   Fokus lokasi di peta, mode scanning, dashboard focus.

4. alertStore
   Daftar alert aktif dari generateAlert().

5. uiStore
   Settings: refreshInterval, notifications toggle.

6. dashboardStore
   State khusus dashboard (filter, selection).

Diagram transisi fase analisis (chatFlowStore):

idle (tidak ada analisis)
  |
  | user kirim chat + lokasi terdeteksi
  v
scanning
  |
  | timer pan peta selesai (~3.2s)
  v
analyzing
  |
  | API Gemini selesai + min duration
  v
result
  |
  | tampil badge (~2.2s)
  v
returning
  |
  | fade transisi (~0.6s)
  v
idle (clearAnalysis)


STRUKTUR FOLDER PENTING
=======================

.
|-- app/
|   |-- page.tsx              Redirect / ke /dashboard
|   |-- layout.tsx            Layout root + Providers
|   |-- globals.css           Token warna, tema gelap, animasi
|   |-- dashboard/page.tsx    Halaman utama + AQUA Assistant
|   |-- map/page.tsx          Peta penuh + mode analisis
|   |-- alerts/page.tsx       Alert Center
|   |-- analytics/page.tsx    Grafik analitik cuaca & risiko
|   |-- history/page.tsx      Riwayat & trend risiko
|   |-- settings/page.tsx     Pengaturan refresh & notifikasi
|   `-- api/
|       |-- weather/route.ts  Proxy fetch BMKG + CSV fallback
|       `-- chat/route.ts     AQUA Assistant (Gemini API)
|-- components/
|   |-- chat/
|   |   |-- WeatherChatPanel.tsx    Panel chat di dashboard
|   |   `-- WeatherChatWidget.tsx   Widget chat floating (non-dashboard)
|   |-- dashboard/
|   |   |-- DashboardPageClient.tsx     Orchestrator dashboard
|   |   |-- DashboardMiniMap.tsx        Mini peta di dashboard
|   |   |-- DashboardTransitionOverlay  Overlay transisi ke/dari peta
|   |   |-- MonitoringTable.tsx         Tabel 10 lokasi pantau
|   |   |-- LocationGrid.tsx            Grid kartu lokasi
|   |   `-- ...
|   |-- map/
|   |   |-- FloodMap.tsx            Komponen Leaflet utama
|   |   |-- MapAnalysisOverlay.tsx  Overlay badge risiko
|   |   |-- MapAnalysisRunner.tsx   Orkestrator fase analisis
|   |   |-- MapPageClient.tsx       Client wrapper halaman peta
|   |   `-- RiskLegend.tsx          Legenda warna risiko
|   |-- charts/
|   |   `-- AnalyticsPageClient.tsx Grafik Recharts
|   |-- layout/
|   |   |-- AppShell.tsx    Shell sidebar + topnav + main
|   |   |-- Sidebar.tsx     Navigasi halaman
|   |   `-- TopNav.tsx      Header + jam WIB + notifikasi
|   `-- ui/                 Komponen shadcn/ui
|-- hooks/
|   |-- useWeatherChat.ts   Logika kirim pesan + alur chat→peta
|   |-- useRealtime.ts      Sync BMKG + alert + polling interval
|   |-- useWeatherData.ts   Fetch cuaca ke weatherStore
|   |-- useLiveClock.ts     Jam WIB real-time (client-only)
|   `-- useAlerts.ts        Hook alert center
|-- lib/
|   |-- floodRiskEngine.ts  Mesin skor risiko AMAN-BAHAYA
|   |-- locations.ts        10 titik pantau + koordinat WGS84
|   |-- weatherConditions.ts  Konfigurasi warna/ikon kondisi cuaca
|   |-- chat/
|   |   |-- queryParser.ts      Parse lokasi & intent waktu dari chat
|   |   |-- locationRisk.ts     Hitung risiko per lokasi untuk analisis
|   |   |-- systemPrompt.ts     System prompt AQUA Assistant
|   |   |-- gemini.ts           Client Gemini API + model fallback
|   |   `-- contextBuilder.ts   Susun konteks JSON cuaca untuk prompt
|   |-- weather/
|   |   |-- aggregator.ts   Fetch BMKG 10 lokasi + CSV fallback
|   |   |-- bmkgMapper.ts     Parse respons JSON BMKG
|   |   |-- csvReader.ts      Baca dataset histori_cuaca_semarang.csv
|   |   |-- cache.ts          Cache in-memory + TTL
|   |   `-- slots.ts          Logika slot 3 jam BMKG
|   `-- map/
|       |-- leafletCleanup.ts   Cleanup instance peta
|       `-- popupHtml.ts        HTML popup marker
|-- store/
|   |-- weatherStore.ts     State data cuaca
|   |-- chatFlowStore.ts    State chat + sesi analisis
|   |-- mapStore.ts         State fokus peta
|   |-- alertStore.ts       State alert
|   |-- uiStore.ts          Settings pengguna
|   `-- dashboardStore.ts   State dashboard
|-- dataset/
|   `-- histori_cuaca_semarang.csv   Data cuaca cadangan BMKG
|-- data/
|   |-- mockWeather.ts      Data mock untuk development
|   |-- mockAlerts.ts       Alert mock
|   `-- mockHistory.ts      Riwayat mock
|-- services/               Service layer (weather, alert, analytics)
|-- types/index.ts          Type definitions
|-- vercel.json             Konfigurasi deploy Vercel (region sin1)
|-- .env.example            Template environment variable
|-- package.json
`-- README.md


LOKASI PANTAU (10 TITIK)
========================

| No | Kelurahan            | Kecamatan        | Kode BMKG adm4  |
|----|----------------------|------------------|-----------------|
| 1  | Miroto               | Semarang Tengah  | 33.74.01.1001   |
| 2  | Bandarharjo          | Semarang Utara   | 33.74.02.1001   |
| 3  | Tembalang            | Tembalang        | 33.74.10.1006   |
| 4  | Wonodri              | Semarang Selatan | 33.74.07.1006   |
| 5  | Candi                | Candisari        | 33.74.08.1001   |
| 6  | Jatingaleh           | Candisari        | 33.74.08.1002   |
| 7  | Gemah                | Pedurungan       | 33.74.06.1007   |
| 8  | Pedurungan Kidul     | Pedurungan       | 33.74.06.1008   |
| 9  | Banyumanik           | Banyumanik       | 33.74.11.1005   |
| 10 | Srondol Kulon        | Banyumanik       | 33.74.11.1006   |


MODEL AI
========

FloodWatch menggunakan dua lapisan kecerdasan:

1. Rule-Based Risk Engine (bukan ML)
   File: lib/floodRiskEngine.ts
   Menghitung skor risiko 0-100 dari kondisi cuaca + kelembapan.
   Transparan, dapat diverifikasi manual.

2. Google Gemini API (AQUA Assistant)
   File: lib/chat/gemini.ts, lib/chat/systemPrompt.ts
   Menerjemahkan data cuaca JSON menjadi jawaban bahasa Indonesia.
   Model fallback chain:
   - gemini-2.5-flash (default)
   - gemini-2.5-flash-lite
   - gemini-2.0-flash-lite

System prompt AQUA Assistant memuat aturan:
- Gunakan hanya data dari JSON konteks (anti-halusinasi).
- Data BMKG slot 3 jam (Saat Ini + 3 Jam Kedepan).
- Skor risiko: 0-39 AMAN, 40-69 WASPADA, 70-89 SIAGA, 90-100 BAHAYA.
- Nada bahasa Indonesia ramah dan actionable.


CARA KERJA PREDIKSI RISIKO
==========================

Saat data cuaca tersedia untuk suatu lokasi:

1. Sistem membaca kondisi cuaca (Cerah s/d Hujan Sangat Lebat) dan kelembapan.
2. floodRiskEngine menghitung skor dasar dari kondisi cuaca.
3. Modifier kelembapan ditambahkan jika kelembapan > 85%, > 90%, atau > 95%.
4. Skor dibatasi maksimal 100.
5. Skor dikonversi ke level AMAN / WASPADA / SIAGA / BAHAYA.
6. Hasil ditampilkan di marker peta, badge analisis, alert, dan konteks AI.


FORMULA SKOR RISIKO BANJIR
==========================

1. Skor Dasar (Base Risk Score)
-------------------------------

Berdasarkan kondisi cuaca BMKG:

| Kondisi Cuaca      | Skor Dasar |
|--------------------|------------|
| Cerah              | 0          |
| Cerah Berawan      | 10         |
| Berawan            | 20         |
| Berawan Tebal      | 35         |
| Hujan Ringan       | 50         |
| Hujan Sedang       | 75         |
| Hujan Lebat        | 90         |
| Hujan Sangat Lebat | 100        |

2. Modifier Kelembapan
----------------------

| Kelembapan | Tambahan Skor |
|------------|---------------|
| > 85%      | +5            |
| > 90%      | +10           |
| > 95%      | +15           |

3. Skor Final
-------------

skor_risiko = min(100, skor_dasar + modifier_kelembapan)

4. Konversi ke Level
--------------------

| Skor    | Level    |
|---------|----------|
| 0 - 39  | AMAN     |
| 40 - 69 | WASPADA  |
| 70 - 89 | SIAGA    |
| 90 - 100| BAHAYA   |


KLASIFIKASI ALERT
=================

Alert otomatis dihasilkan oleh generateAlert() jika:

1. Skor risiko >= 40 (WASPADA ke atas), ATAU
2. Kondisi cuaca mengandung kata "Hujan" (meski skor < 40).

Severity alert:

| Kondisi            | Severity    |
|--------------------|-------------|
| Skor >= 90         | emergency   |
| Skor >= 70         | critical    |
| Skor >= 40 / hujan | warning     |
| Lainnya            | information |


CARA KERJA DATA BMKG
====================

1. /api/weather memanggil aggregator.ts.
2. Aggregator fetch paralel ke BMKG API untuk 10 kode adm4.
3. Jika BMKG online: data live dipakai (status: online).
4. Jika sebagian gagal: hybrid live + CSV (status: degraded).
5. Jika semua gagal: full CSV fallback (status: offline).
6. Background recovery probe setiap 5 menit saat BMKG offline.
7. Sync otomatis pada batas slot 3 jam BMKG (WIB).
8. Polling interval mengikuti setting pengguna (default dari uiStore).

Sumber data ditampilkan di DataSourceBanner: BMKG / Hybrid / CSV.


INSTALASI DAN MENJALANKAN LOKAL
===============================

Pastikan Node.js sudah terpasang (disarankan v20+).

1. Clone repository:

   git clone https://github.com/shafwar/FloodWatch-AI-.git
   cd FloodWatch-AI-

2. Install dependency:

   npm install

3. Salin environment variable:

   cp .env.example .env.local

4. Isi GEMINI_API_KEY di .env.local
   (gratis di https://aistudio.google.com/apikey)

5. Jalankan development server:

   npm run dev

6. Buka aplikasi di:

   http://localhost:3000

Build production:

   npm run build
   npm run start

Lint:

   npm run lint


ENVIRONMENT VARIABLES
===================

| Variable       | Wajib | Keterangan                                      |
|----------------|-------|-------------------------------------------------|
| GEMINI_API_KEY | Ya    | API key Google Gemini untuk AQUA Assistant      |
| GEMINI_MODEL   | Tidak | Model default: gemini-2.5-flash (ada fallback) |


DEPLOYMENT KE VERCEL
====================

Project ini sudah dikonfigurasi untuk Vercel.

Live Demo: https://floodwatch-semarang.vercel.app

Alur deployment:

1. Push repository ke GitHub:
   https://github.com/shafwar/FloodWatch-AI-

2. Import repository di Vercel (atau sudah terhubung via CLI).

3. Tambahkan environment variable di Vercel Dashboard:
   - GEMINI_API_KEY (Production, Preview, Development)
   - GEMINI_MODEL (opsional)

4. Vercel mendeteksi Next.js secara otomatis.
   Build command: npm run build
   Region: Singapore (sin1) — dikonfigurasi di vercel.json

5. Deploy production:

   npx vercel@latest --prod --yes

Catatan domain:
- Domain utama production: floodwatch-semarang.vercel.app
- Domain floodwatch.vercel.app sudah digunakan proyek lain di Vercel secara
  global dan tidak dapat dialokasikan untuk proyek ini.


BATASAN PROTOTYPE
=================

- Hanya 10 titik pantau kelurahan di Kota Semarang (bukan seluruh kota).
- Skor risiko berbasis cuaca BMKG, bukan sensor genangan atau riwayat banjir aktual.
- Data BMKG slot 3 jam — bukan update per menit.
- Tidak mempertimbangkan topografi, drainase, atau kontur tanah lokal.
- Gemini dapat halusinasi jika system prompt tidak diperketat — perlu validasi.
- BMKG API dapat offline/rate-limited — CSV fallback digunakan untuk demo.
- Belum ada autentikasi pengguna atau multi-tenant.
- Belum ada notifikasi push (hanya in-app alert bell).
- Belum terintegrasi sensor IoT lapangan.


TRADEOFF DESAIN SISTEM
======================

1. Rule-based engine vs Machine Learning
   Kelebihan:
   - Transparan dan mudah dijelaskan ke pengguna/dosen.
   - Tidak butuh dataset banjir historis besar.

   Tradeoff:
   - Tidak seakurat model prediktif yang mempertimbangkan banyak variabel.

2. Gemini untuk narasi, bukan perhitungan
   Kelebihan:
   - Jawaban natural dan mudah dipahami masyarakat awam.
   - Skor risiko tetap konsisten dan dapat diverifikasi.

   Tradeoff:
   - Perlu system prompt ketat untuk mencegah halusinasi.

3. BMKG API + CSV fallback
   Kelebihan:
   - Demo tetap berjalan saat BMKG offline atau rate-limited.
   - Data resmi BMKG saat online.

   Tradeoff:
   - Data CSV bisa tidak se-fresh data live BMKG.

4. Alur chat → peta → analisis
   Kelebihan:
   - UX immersive — pengguna melihat analisis visual di peta.
   - Jawaban AI sinkron dengan badge risiko.

   Tradeoff:
   - Kompleksitas state management (chatFlowStore, mapStore, overlay).
   - Perlu penanganan khusus agar overlay tidak bentrok.

5. Leaflet vs Mapbox
   Kelebihan:
   - Gratis, open-source, cukup untuk 10 marker.

   Tradeoff:
   - Fitur peta premium (heatmap, 3D) tidak tersedia bawaan.

6. Next.js + Vercel
   Kelebihan:
   - Production-ready, deploy cepat, API Routes untuk BMKG & Gemini.

   Tradeoff:
   - Serverless timeout membatasi fetch paralel ke banyak lokasi.


ROADMAP PENGEMBANGAN
====================

Prioritas teknis berikutnya:

- Menambah titik pantau ke seluruh kelurahan Semarang.
- Integrasi sensor IoT ketinggian air (ESP32) untuk data genangan real-time.
- Notifikasi push (WhatsApp/Telegram) untuk alert BAHAYA.
- Riwayat banjir aktual dari data BPBD/Dinas PU.
- Mempertimbangkan topografi dan sistem drainase dalam skor risiko.
- Mode PWA/offline untuk akses saat jaringan terbatas.
- Autentikasi pengguna dan preferensi lokasi favorit.
- Evaluasi akurasi skor risiko dengan data banjir historis Semarang.
- Optimasi fetch BMKG dengan queue dan caching Redis.
- Custom domain (floodwatch.id atau sejenisnya).


CATATAN PENGEMBANGAN
====================

Beberapa bagian kode penting:

1. hooks/useWeatherChat.ts
   Mengelola kirim pesan chat, deteksi lokasi, navigasi ke /map,
   fetch Gemini paralel, dan sinkronisasi jawaban AI dengan badge peta.

2. components/map/MapAnalysisRunner.tsx
   Orkestrator fase analisis: scanning → analyzing → result → returning.
   Timing: SCAN_PAN_MS=3200, MIN_ANALYSIS_MS=2500, RESULT_DISPLAY_MS=2200.

3. lib/floodRiskEngine.ts
   Inti perhitungan skor risiko dan generator alert otomatis.

4. lib/weather/aggregator.ts
   Fetch BMKG 10 lokasi, status online/degraded/offline, CSV fallback.

5. lib/chat/systemPrompt.ts
   System prompt AQUA Assistant — aturan anti-halusinasi dan slot 3 jam BMKG.

6. hooks/useRealtime.ts
   Sync BMKG on mount, slot boundary, polling interval, recovery probe.

7. components/map/FloodMap.tsx
   Peta Leaflet dengan custom marker, fly-to, mode analisis tanpa popup bentrok.

Tim Pengembang
--------------
FloodWatch AI
- Naufal Shafi Anwar  (24060122140185)
- Farrel Syadi Ramadhan (24060122140181)

Universitas Diponegoro — Fakultas Sains dan Matematika
Mata Kuliah: AI For Real Impact 2026
