export function classifyTask(text, hasFiles = false) {
  const lower = text.toLowerCase();
  if (lower.includes('فشل') || lower.includes('خطأ') || lower.includes('error')) return 'error';
  if (hasFiles || lower.includes('سير') || lower.includes('cv') || lower.includes('resume')) return 'cv';
  if (lower.includes('أريد شراء') || lower.includes('اريد شراء') || lower.includes('ابحث عن سيارة') || lower.includes('ابحث عن منتج')) return 'marketplace_search';
  if (lower.includes('دهان') || lower.includes('نجار') || lower.includes('بلاط') || lower.includes('كهربائي') || lower.includes('كهربا') || lower.includes('سباك') || lower.includes('حداد') || lower.includes('ألمنيوم') || lower.includes('المونيوم') || lower.includes('تكييف') || lower.includes('تنظيف') || lower.includes('حرفي') || lower.includes('صيانة')) return 'publish';
  if (lower.includes('نشر') || lower.includes('إعلان') || lower.includes('اعلان') || lower.includes('مطعم') || lower.includes('مؤسسة') || lower.includes('خدمة') || lower.includes('شراء') || lower.includes('بيع') || lower.includes('سيارة') || lower.includes('منتج')) return 'publish';
  if (lower.includes('وظيف') || lower.includes('عمل') || lower.includes('job')) return 'jobs';
  if (lower.includes('رحل') || lower.includes('سياح') || lower.includes('فندق') || lower.includes('trip')) return 'travel';
  return 'general';
}

export const taskLabels = {
  publish: 'نشر معلومة محلية',
  general: 'بحث عام',
  cv: 'تحليل سيرة ذاتية',
  jobs: 'بحث عن وظائف',
  travel: 'تخطيط سياحة',
  error: 'اختبار فشل المصدر',
};
