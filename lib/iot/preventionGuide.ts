// =============================================================================
// AQUA-SENSE — Prevention & Mitigation Recommendations
// Rekomendasi pencegahan berdasarkan level risiko banjir
// =============================================================================

import type { FloodLevel, PreventionAction } from '@/types';

const BASE_ACTIONS: Record<FloodLevel, PreventionAction[]> = {
  AMAN: [
    {
      id: 'aman-1',
      category: 'mitigasi',
      priority: 'rendah',
      title: 'Pantau saluran drainase',
      description: 'Pastikan saluran tidak tersumbat sampah atau sedimentasi.',
    },
    {
      id: 'aman-2',
      category: 'komunikasi',
      priority: 'rendah',
      title: 'Siapkan kontak darurat RT/RW',
      description: 'Simpan nomor BPBD Kota Semarang (112) dan koordinator warga.',
    },
  ],
  WASPADA: [
    {
      id: 'waspada-1',
      category: 'mitigasi',
      priority: 'sedang',
      title: 'Bersihkan gorong-gorong sekitar rumah',
      description: 'Singkirkan sampah dan daun kering yang menghambat aliran air.',
    },
    {
      id: 'waspada-2',
      category: 'kesehatan',
      priority: 'sedang',
      title: 'Siapkan tas darurat ringan',
      description: 'Dokumen penting, obat-obatan, power bank, dan makanan kering.',
    },
    {
      id: 'waspada-3',
      category: 'komunikasi',
      priority: 'sedang',
      title: 'Pantau update AQUA-SENSE',
      description: 'Cek dashboard setiap 30 menit; sensor IoT mendeteksi kenaikan air.',
    },
  ],
  SIAGA: [
    {
      id: 'siaga-1',
      category: 'evakuasi',
      priority: 'tinggi',
      title: 'Siapkan jalur evakuasi',
      description: 'Kenali titik kumpul aman dan rute ke lantai atas atau lokasi lebih tinggi.',
    },
    {
      id: 'siaga-2',
      category: 'mitigasi',
      priority: 'tinggi',
      title: 'Angkat barang ke ketinggian aman',
      description: 'Pindahkan elektronik, dokumen, dan barang berharga minimal 50 cm dari lantai.',
    },
    {
      id: 'siaga-3',
      category: 'infrastruktur',
      priority: 'sedang',
      title: 'Matikan panel listrik area bawah',
      description: 'Putuskan MCB area rawan genangan untuk mencegah korsleting.',
    },
    {
      id: 'siaga-4',
      category: 'komunikasi',
      priority: 'tinggi',
      title: 'Hubungi keluarga & tetangga',
      description: 'Informasikan status risiko SIAGA; koordinasi dengan RT setempat.',
    },
  ],
  BAHAYA: [
    {
      id: 'bahaya-1',
      category: 'evakuasi',
      priority: 'tinggi',
      title: 'SEGERA evakuasi ke titik aman',
      description: 'Tinggalkan area genangan. Jangan menunggu air mencapai lutut.',
    },
    {
      id: 'bahaya-2',
      category: 'evakuasi',
      priority: 'tinggi',
      title: 'Jangan melintasi arus deras',
      description: 'Air 15 cm deras dapat menjatuhkan orang dewasa. Gunakan jalur resmi BPBD.',
    },
    {
      id: 'bahaya-3',
      category: 'infrastruktur',
      priority: 'tinggi',
      title: 'Aktivasi pompa darurat (BPBD/Pemkot)',
      description: 'Koordinasikan pengaktifan pompa sentral di titik rawan sesuai peta GIS.',
    },
    {
      id: 'bahaya-4',
      category: 'kesehatan',
      priority: 'tinggi',
      title: 'Waspada penyakit pasca-banjir',
      description: 'Gunakan air bersih, cuci tangan, hindari genangan untuk mencegah leptospirosis.',
    },
    {
      id: 'bahaya-5',
      category: 'komunikasi',
      priority: 'tinggi',
      title: 'Laporkan ke BPBD & 112',
      description: 'Sampaikan lokasi tepat dan jumlah warga yang membutuhkan bantuan evakuasi.',
    },
  ],
};

export function getPreventionActions(
  level: FloodLevel,
  options?: { highWater?: boolean; heavyRain?: boolean }
): PreventionAction[] {
  const actions = [...(BASE_ACTIONS[level] ?? BASE_ACTIONS.AMAN)];

  if (options?.highWater && level !== 'BAHAYA') {
    actions.unshift({
      id: 'sensor-water-high',
      category: 'infrastruktur',
      priority: 'tinggi',
      title: 'Sensor IoT: kapasitas saluran tinggi',
      description:
        'Ketinggian air mendekati batas maksimal saluran. Prioritaskan pembersihan inlet dan aktivasi pompa lokal.',
    });
  }

  if (options?.heavyRain) {
    actions.push({
      id: 'forecast-rain',
      category: 'mitigasi',
      priority: 'tinggi',
      title: 'Prakiraan BMKG: hujan berlanjut',
      description:
        'Data fusion mendeteksi hujan makro + sensor lokal. Siapkan penahan pintu dan sandbag jika tersedia.',
    });
  }

  return actions;
}
