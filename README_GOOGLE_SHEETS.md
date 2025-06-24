# نظام إدارة مبيعات الكتب مع ربط Google Sheets

تطبيق React Native Expo لإدارة مبيعات الكتب مع إمكانية ربطه بجداول بيانات Google لحفظ ومزامنة البيانات.

## المميزات

- ✅ إدارة المبيعات والمخزون
- ✅ ربط مع Google Sheets لحفظ البيانات
- ✅ مزامنة البيانات بين التطبيق وجداول البيانات
- ✅ واجهة مستخدم باللغة العربية
- ✅ تقارير مفصلة

## متطلبات التشغيل

- Node.js (الإصدار 16 أو أحدث)
- npm أو yarn
- Expo CLI
- حساب Google Cloud Platform
- جدول بيانات Google

## إعداد Google Sheets API

### 1. تمكين Google Sheets API

1. انتقل إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروعًا جديدًا أو اختر مشروعًا موجودًا
3. انتقل إلى **APIs & Services** > **Library**
4. ابحث عن "Google Sheets API" وقم بتمكينه

### 2. إنشاء بيانات الاعتماد

1. انتقل إلى **APIs & Services** > **Credentials**
2. انقر على **+ CREATE CREDENTIALS** واختر **OAuth client ID**
3. اختر نوع التطبيق المناسب
4. قم بتكوين شاشة موافقة OAuth إذا لم تكن قد قمت بذلك
5. احفظ `Client ID` و `Client Secret`

### 3. إعداد جدول البيانات

1. أنشئ جدول بيانات جديد في Google Sheets
2. أنشئ الأوراق التالية:
   - **Sales**: للمبيعات
   - **Inventory**: للمخزون
   - **Reports**: للتقارير

3. أضف العناوين التالية:

**ورقة Sales:**
```
التاريخ | عنوان الكتاب | الكمية | السعر | المجموع | اسم العميل
```

**ورقة Inventory:**
```
عنوان الكتاب | المؤلف | ISBN | الكمية | السعر | الفئة
```

4. انسخ معرف جدول البيانات من الرابط:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

## تثبيت وتشغيل التطبيق

### 1. تثبيت التبعيات

```bash
npm install
```

### 2. تحديث إعدادات Google Sheets

افتح الملف `src/config/googleSheetsConfig.ts` وقم بتحديث القيم التالية:

```typescript
export const GOOGLE_SHEETS_CONFIG = {
  CLIENT_ID: 'your-client-id-here',
  CLIENT_SECRET: 'your-client-secret-here',
  SPREADSHEET_ID: 'your-spreadsheet-id-here',
  // باقي الإعدادات...
};
```

### 3. تشغيل التطبيق

```bash
npx expo start
```

## استخدام التطبيق

### 1. تسجيل الدخول إلى Google Sheets

- افتح التطبيق
- انتقل إلى شاشة المبيعات أو المخزون
- انقر على "تسجيل الدخول إلى Google Sheets"
- اتبع خطوات المصادقة

### 2. إضافة مبيعة جديدة

- انتقل إلى شاشة المبيعات
- انقر على "إضافة مبيعة جديدة"
- املأ البيانات المطلوبة
- انقر على "حفظ المبيعة"

### 3. إدارة المخزون

- انتقل إلى شاشة المخزون
- انقر على "إضافة كتاب جديد"
- املأ بيانات الكتاب
- انقر على "حفظ"

### 4. مزامنة البيانات

- بعد تسجيل الدخول إلى Google Sheets
- انقر على "مزامنة البيانات" لتحديث البيانات من جداول البيانات

## بنية المشروع

```
src/
├── components/          # المكونات المشتركة
├── screens/            # شاشات التطبيق
│   ├── SalesScreen.tsx     # شاشة المبيعات
│   ├── InventoryScreen.tsx # شاشة المخزون
│   ├── HomeScreen.tsx      # الشاشة الرئيسية
│   └── ReportsScreen.tsx   # شاشة التقارير
├── services/           # خدمات التطبيق
│   └── GoogleSheetsService.ts # خدمة Google Sheets
├── config/             # ملفات الإعدادات
│   └── googleSheetsConfig.ts  # إعدادات Google Sheets
├── store/              # إدارة البيانات المحلية
├── types/              # تعريفات الأنواع
└── theme/              # إعدادات التصميم
```

## المكتبات المستخدمة

- **React Native**: إطار العمل الأساسي
- **Expo**: منصة التطوير
- **React Native Paper**: مكونات واجهة المستخدم
- **React Navigation**: التنقل بين الشاشات
- **Axios**: طلبات HTTP
- **Expo Auth Session**: مصادقة OAuth 2.0

## استكشاف الأخطاء

### خطأ في المصادقة

- تأكد من صحة `Client ID` و `Client Secret`
- تأكد من تمكين Google Sheets API
- تحقق من إعدادات OAuth consent screen

### خطأ في الوصول إلى جدول البيانات

- تأكد من صحة `SPREADSHEET_ID`
- تأكد من أن المستخدم لديه إذن الوصول إلى جدول البيانات
- تحقق من أسماء الأوراق في جدول البيانات

### خطأ في حفظ البيانات

- تأكد من أن العناوين في جدول البيانات تطابق التوقعات
- تحقق من صحة نطاقات البيانات في الإعدادات

## الدعم

إذا واجهت أي مشاكل، يرجى التحقق من:

1. إعدادات Google Cloud Console
2. أذونات جدول البيانات
3. إعدادات التطبيق في ملف `googleSheetsConfig.ts`

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

