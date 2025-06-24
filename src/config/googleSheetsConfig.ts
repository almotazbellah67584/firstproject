// إعدادات Google Sheets API
export const GOOGLE_SHEETS_CONFIG = {
  // يجب استبدال هذه القيم ببياناتك الفعلية من Google Cloud Console
  CLIENT_ID: 'YOUR_CLIENT_ID_HERE',
  CLIENT_SECRET: 'YOUR_CLIENT_SECRET_HERE',
  
  // معرف جدول البيانات - يمكن العثور عليه في رابط جدول البيانات
  // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  
  // أسماء الأوراق في جدول البيانات
  SHEETS: {
    SALES: 'Sales',
    INVENTORY: 'Inventory',
    REPORTS: 'Reports',
  },
  
  // نطاقات البيانات
  RANGES: {
    SALES_DATA: 'Sales!A:F',
    INVENTORY_DATA: 'Inventory!A:F',
    REPORTS_DATA: 'Reports!A:F',
  },
  
  // عناوين الأعمدة
  HEADERS: {
    SALES: ['التاريخ', 'عنوان الكتاب', 'الكمية', 'السعر', 'المجموع', 'اسم العميل'],
    INVENTORY: ['عنوان الكتاب', 'المؤلف', 'ISBN', 'الكمية', 'السعر', 'الفئة'],
    REPORTS: ['التاريخ', 'نوع التقرير', 'البيانات', 'الملاحظات'],
  },
};

// دالة للتحقق من صحة الإعدادات
export const validateConfig = (): boolean => {
  const { CLIENT_ID, CLIENT_SECRET, SPREADSHEET_ID } = GOOGLE_SHEETS_CONFIG;
  
  if (CLIENT_ID === 'YOUR_CLIENT_ID_HERE' || 
      CLIENT_SECRET === 'YOUR_CLIENT_SECRET_HERE' || 
      SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
    console.warn('تحذير: يجب تحديث إعدادات Google Sheets API في ملف config.ts');
    return false;
  }
  
  return true;
};

