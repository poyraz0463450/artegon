// ── UTILS ────────────────────────────────────────────────────────────────────

import { serverTimestamp } from 'firebase/firestore';

export function generateDocNumber(prefix, existing = [], regex) {
  const year = new Date().getFullYear();
  const nums = existing
    .map((o) => {
      const m = (o.numberField || '').match(regex || new RegExp(`${prefix}-\\d{4}-(\\d+)`));
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
}

export function formatDate(value) {
  if (!value) return '—';
  const d = value?.toDate ? value.toDate() : new Date(value);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDateOnly(value) {
  if (!value) return '—';
  const d = value?.toDate ? value.toDate() : new Date(value);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatNumber(n) {
  return (n ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatCurrency(n, curr = 'TRY') {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: curr }).format(n ?? 0);
}

// ── CONSTANTS ────────────────────────────────────────────────────────────────

export const PART_CATEGORIES = ['Hammadde', 'Parça'];

export const PART_SUB_CATEGORIES = [
  'Çelik', 'Polimer', 'Yay', 'Pim', 'Vida', 'Alüminyum', 'Dövme Parça', 'Döküm Parça', 'Elektronik', 'Diğer'
];

export const PART_UNITS = ['Adet', 'Kg', 'Metre', 'mm', 'Takım', 'Litre'];

export const REVISION_STATUSES = ['Aktif', 'Pasif', 'Prototip', 'Üretimden Kalktı'];

export const STOCK_STATUSES = ['Sağlam', 'Kritik', 'Fire', 'Karantina'];

export const MOVEMENT_TYPES = [
  'Üretim Girişi', 'Satınalma Girişi', 'Transfer', 'İş Emri Çıkışı', 'Fire', 'İade', 'Sayım Düzeltme'
];

export const WORK_CENTER_TYPES = ['CNC', 'Manuel', 'Isıl İşlem', 'Montaj', 'Kaplama', 'Test', 'Paketleme'];

export const WORK_CENTER_STATUSES = ['Müsait', 'Dolu', 'Bakımda', 'Arıza'];

export const WO_TYPES = ['Seri Üretim', 'Prototip', 'Tamir', 'Numune'];

export const WO_STATUSES = ['Taslak', 'Onaylı', 'Malzeme Hazır', 'Üretimde', 'Tamamlandı', 'İptal'];

export const URGENCY_LEVELS = ['Normal', 'Acil', 'Çok Acil'];

export const INSPECTION_TYPES = ['Giriş Kalite', 'Proses', 'Final', 'Periyodik'];

export const CHARACTERISTIC_TYPES = ['Boyutsal', 'Görsel', 'Fonksiyonel', 'Yüzey'];

export const QC_RESULTS = ['Kabul', 'Red', 'Şartlı Kabul'];

export const NCR_STATUSES = ['Açık', 'İncelemede', 'Kapalı'];

export const DOC_TYPES = [
  'Teknik Resim', 'Prosedür', 'Talimat', 'Form', 'Kalite Planı', 'Test Raporu', 'Sertifika', 'MSDS'
];

export const DOC_STATUSES = ['Taslak', 'İncelemede', 'Onaylandı', 'Pasif', 'İptal'];

export const ROLE_LABELS = {
  admin: 'Sistem Yöneticisi',
  engineer: 'Mühendis (PLM)',
  warehouse: 'Depo Sorumlusu',
  kalite: 'Kalite (QMS)',
  operator: 'Üretim Operatörü',
  satin_alma: 'Satınalma Uzmanı',
  viewer: 'İzleyici'
};

export const PR_STATUSES = ['Taslak', 'Pending Approval', 'Onaylandı', 'Reddedildi', 'Siparişe Dönüştü'];

export const PO_STATUSES = ['Taslak', 'Gönderildi', 'Kısmi Teslim', 'Tamamlandı', 'İptal'];

export const WO_STATUS_FLOW = ['Taslak', 'Onaylı', 'Malzeme Hazır', 'Üretimde', 'Kalitede', 'Tamamlandı', 'İptal'];

export const WO_OPERATIONS = ['CNC Torna', 'CNC Freze', 'Taşlama', 'Isıl İşlem', 'Kaplama', 'Montaj', 'Test', 'Paketleme'];

export const DOC_CATEGORIES = ['Teknik Resim', 'Prosedür', 'Talimat', 'Form', 'Kalite Planı', 'Test Raporu', 'Sertifika', 'MSDS'];

export const DOC_REV_STATUSES = ['Taslak', 'İncelemede', 'Onaylandı', 'Pasif', 'İptal'];

export const GRN_STATUSES = ['Bekliyor', 'Kısmi Kabul', 'Tam Kabul', 'Reddedildi'];

export function generateWONumber(existing = []) {
  return generateDocNumber('WO', existing);
}
