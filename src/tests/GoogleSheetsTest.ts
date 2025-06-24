import GoogleSheetsService from '../services/GoogleSheetsService';
import { GOOGLE_SHEETS_CONFIG, validateConfig } from '../config/googleSheetsConfig';

// ملف اختبار للتكامل مع Google Sheets
// يمكن استخدام هذا الملف للتأكد من أن جميع الوظائف تعمل بشكل صحيح

export class GoogleSheetsTestSuite {
  
  // اختبار صحة الإعدادات
  static testConfiguration(): boolean {
    console.log('🔧 اختبار إعدادات Google Sheets...');
    
    const isValid = validateConfig();
    if (isValid) {
      console.log('✅ الإعدادات صحيحة');
      return true;
    } else {
      console.log('❌ الإعدادات غير صحيحة - يجب تحديث ملف googleSheetsConfig.ts');
      return false;
    }
  }

  // اختبار المصادقة
  static async testAuthentication(): Promise<boolean> {
    console.log('🔐 اختبار المصادقة مع Google Sheets...');
    
    try {
      const success = await GoogleSheetsService.authenticate();
      if (success) {
        console.log('✅ تم تسجيل الدخول بنجاح');
        return true;
      } else {
        console.log('❌ فشل في تسجيل الدخول');
        return false;
      }
    } catch (error) {
      console.log('❌ خطأ في المصادقة:', error);
      return false;
    }
  }

  // اختبار قراءة البيانات
  static async testReadData(): Promise<boolean> {
    console.log('📖 اختبار قراءة البيانات من Google Sheets...');
    
    try {
      // اختبار قراءة بيانات المبيعات
      const salesData = await GoogleSheetsService.getSalesData();
      console.log('📊 بيانات المبيعات:', salesData);
      
      // اختبار قراءة بيانات المخزون
      const inventoryData = await GoogleSheetsService.getInventoryData();
      console.log('📦 بيانات المخزون:', inventoryData);
      
      console.log('✅ تم قراءة البيانات بنجاح');
      return true;
    } catch (error) {
      console.log('❌ خطأ في قراءة البيانات:', error);
      return false;
    }
  }

  // اختبار كتابة بيانات المبيعات
  static async testWriteSalesData(): Promise<boolean> {
    console.log('💰 اختبار كتابة بيانات المبيعات...');
    
    try {
      const testSaleData = {
        bookTitle: 'كتاب تجريبي',
        quantity: 2,
        price: 50.00,
        total: 100.00,
        date: new Date().toLocaleDateString('ar-SA'),
        customerName: 'عميل تجريبي',
      };
      
      const success = await GoogleSheetsService.saveSaleData(testSaleData);
      if (success) {
        console.log('✅ تم حفظ بيانات المبيعات بنجاح');
        return true;
      } else {
        console.log('❌ فشل في حفظ بيانات المبيعات');
        return false;
      }
    } catch (error) {
      console.log('❌ خطأ في كتابة بيانات المبيعات:', error);
      return false;
    }
  }

  // اختبار كتابة بيانات المخزون
  static async testWriteInventoryData(): Promise<boolean> {
    console.log('📚 اختبار كتابة بيانات المخزون...');
    
    try {
      const testInventoryData = {
        bookTitle: 'كتاب مخزون تجريبي',
        author: 'مؤلف تجريبي',
        isbn: '978-1234567890',
        quantity: 10,
        price: 75.00,
        category: 'تجريبي',
      };
      
      const success = await GoogleSheetsService.saveInventoryData(testInventoryData);
      if (success) {
        console.log('✅ تم حفظ بيانات المخزون بنجاح');
        return true;
      } else {
        console.log('❌ فشل في حفظ بيانات المخزون');
        return false;
      }
    } catch (error) {
      console.log('❌ خطأ في كتابة بيانات المخزون:', error);
      return false;
    }
  }

  // تشغيل جميع الاختبارات
  static async runAllTests(): Promise<void> {
    console.log('🚀 بدء اختبارات التكامل مع Google Sheets...');
    console.log('=====================================');
    
    const results = {
      configuration: false,
      authentication: false,
      readData: false,
      writeSalesData: false,
      writeInventoryData: false,
    };

    // اختبار الإعدادات
    results.configuration = this.testConfiguration();
    
    if (!results.configuration) {
      console.log('⚠️ لا يمكن المتابعة بدون إعدادات صحيحة');
      return;
    }

    // اختبار المصادقة
    results.authentication = await this.testAuthentication();
    
    if (!results.authentication) {
      console.log('⚠️ لا يمكن المتابعة بدون مصادقة ناجحة');
      return;
    }

    // اختبار قراءة البيانات
    results.readData = await this.testReadData();

    // اختبار كتابة بيانات المبيعات
    results.writeSalesData = await this.testWriteSalesData();

    // اختبار كتابة بيانات المخزون
    results.writeInventoryData = await this.testWriteInventoryData();

    // عرض النتائج النهائية
    console.log('=====================================');
    console.log('📋 نتائج الاختبارات:');
    console.log(`🔧 الإعدادات: ${results.configuration ? '✅' : '❌'}`);
    console.log(`🔐 المصادقة: ${results.authentication ? '✅' : '❌'}`);
    console.log(`📖 قراءة البيانات: ${results.readData ? '✅' : '❌'}`);
    console.log(`💰 كتابة المبيعات: ${results.writeSalesData ? '✅' : '❌'}`);
    console.log(`📚 كتابة المخزون: ${results.writeInventoryData ? '✅' : '❌'}`);
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
      console.log('🎉 جميع الاختبارات نجحت! التكامل مع Google Sheets يعمل بشكل صحيح.');
    } else {
      console.log('⚠️ بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه.');
    }
  }

  // اختبار سريع للتحقق من الاتصال
  static async quickTest(): Promise<boolean> {
    console.log('⚡ اختبار سريع للاتصال مع Google Sheets...');
    
    try {
      // التحقق من الإعدادات
      if (!validateConfig()) {
        console.log('❌ الإعدادات غير صحيحة');
        return false;
      }

      // محاولة المصادقة
      const authSuccess = await GoogleSheetsService.authenticate();
      if (!authSuccess) {
        console.log('❌ فشل في المصادقة');
        return false;
      }

      // محاولة قراءة بيانات بسيطة
      await GoogleSheetsService.readData('Sales!A1:A1');
      
      console.log('✅ الاتصال مع Google Sheets يعمل بشكل صحيح');
      return true;
    } catch (error) {
      console.log('❌ خطأ في الاتصال:', error);
      return false;
    }
  }
}

// دالة مساعدة لتشغيل الاختبارات من التطبيق
export const runGoogleSheetsTests = async () => {
  await GoogleSheetsTestSuite.runAllTests();
};

// دالة مساعدة للاختبار السريع
export const quickGoogleSheetsTest = async () => {
  return await GoogleSheetsTestSuite.quickTest();
};


  // اختبار وظائف جلب البيانات المجمعة للشاشات الإحصائية
  static async testAnalyticsFeatures(): Promise<boolean> {
    console.log('📊 اختبار وظائف التحليلات والإحصائيات...');
    
    try {
      // اختبار جلب الملخص المالي
      console.log('💰 اختبار جلب الملخص المالي...');
      const financialSummary = await GoogleSheetsService.getFinancialSummary();
      console.log('الملخص المالي:', financialSummary);

      // اختبار جلب الكتب الأكثر مبيعاً
      console.log('📚 اختبار جلب الكتب الأكثر مبيعاً...');
      const bestSellingBooks = await GoogleSheetsService.getBestSellingBooks(5);
      console.log('الكتب الأكثر مبيعاً:', bestSellingBooks);

      // اختبار جلب المبيعات الأخيرة
      console.log('🕒 اختبار جلب المبيعات الأخيرة...');
      const recentSales = await GoogleSheetsService.getRecentSales(5);
      console.log('المبيعات الأخيرة:', recentSales);

      // اختبار جلب حالة المخزون
      console.log('📦 اختبار جلب حالة المخزون...');
      const inventoryStatus = await GoogleSheetsService.getInventoryStatus();
      console.log('حالة المخزون:', inventoryStatus);

      // اختبار جلب تقرير المبيعات الشهري
      console.log('📅 اختبار جلب تقرير المبيعات الشهري...');
      const monthlySalesReport = await GoogleSheetsService.getMonthlySalesReport();
      console.log('تقرير المبيعات الشهري:', monthlySalesReport);

      console.log('✅ تم اختبار جميع وظائف التحليلات بنجاح');
      return true;
    } catch (error) {
      console.log('❌ خطأ في اختبار وظائف التحليلات:', error);
      return false;
    }
  }

  // تشغيل جميع الاختبارات الشاملة
  static async runComprehensiveTests(): Promise<void> {
    console.log('🚀 بدء الاختبارات الشاملة لجميع وظائف Google Sheets...');
    console.log('=======================================================');
    
    const results = {
      configuration: false,
      authentication: false,
      readData: false,
      writeSalesData: false,
      writeInventoryData: false,
      analyticsFeatures: false,
    };

    // اختبار الإعدادات
    results.configuration = this.testConfiguration();
    
    if (!results.configuration) {
      console.log('⚠️ لا يمكن المتابعة بدون إعدادات صحيحة');
      return;
    }

    // اختبار المصادقة
    results.authentication = await this.testAuthentication();
    
    if (!results.authentication) {
      console.log('⚠️ لا يمكن المتابعة بدون مصادقة ناجحة');
      return;
    }

    // اختبار قراءة البيانات
    results.readData = await this.testReadData();

    // اختبار كتابة بيانات المبيعات
    results.writeSalesData = await this.testWriteSalesData();

    // اختبار كتابة بيانات المخزون
    results.writeInventoryData = await this.testWriteInventoryData();

    // اختبار وظائف التحليلات والإحصائيات
    results.analyticsFeatures = await this.testAnalyticsFeatures();

    // عرض النتائج النهائية
    console.log('=======================================================');
    console.log('📋 نتائج الاختبارات الشاملة:');
    console.log(`🔧 الإعدادات: ${results.configuration ? '✅' : '❌'}`);
    console.log(`🔐 المصادقة: ${results.authentication ? '✅' : '❌'}`);
    console.log(`📖 قراءة البيانات: ${results.readData ? '✅' : '❌'}`);
    console.log(`💰 كتابة المبيعات: ${results.writeSalesData ? '✅' : '❌'}`);
    console.log(`📚 كتابة المخزون: ${results.writeInventoryData ? '✅' : '❌'}`);
    console.log(`📊 وظائف التحليلات: ${results.analyticsFeatures ? '✅' : '❌'}`);
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
      console.log('🎉 جميع الاختبارات نجحت! التكامل الشامل مع Google Sheets يعمل بشكل مثالي.');
      console.log('✨ التطبيق جاهز للاستخدام مع جميع الشاشات مربوطة بـ Google Sheets.');
    } else {
      console.log('⚠️ بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه.');
    }
  }
}

// دالة مساعدة لتشغيل الاختبارات الشاملة من التطبيق
export const runComprehensiveGoogleSheetsTests = async () => {
  await GoogleSheetsTestSuite.runComprehensiveTests();
};

// دالة مساعدة لاختبار وظائف التحليلات فقط
export const testAnalyticsFeatures = async () => {
  return await GoogleSheetsTestSuite.testAnalyticsFeatures();
};

