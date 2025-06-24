import axios from 'axios';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';

// إعدادات OAuth 2.0 - يجب استبدالها ببياناتك الفعلية
const CLIENT_ID = 'YOUR_CLIENT_ID_HERE'; // استبدل هذا بـ Client ID الخاص بك
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE'; // استبدل هذا بـ Client Secret الخاص بك
const REDIRECT_URI = AuthSession.makeRedirectUri({ useProxy: true });

// نطاقات الوصول المطلوبة
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// معرف جدول البيانات - يجب استبداله بمعرف جدول البيانات الخاص بك
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

class GoogleSheetsService {
  private accessToken: string | null = null;

  // تسجيل الدخول باستخدام OAuth 2.0
  async authenticate(): Promise<boolean> {
    try {
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36).substring(2, 15),
        { encoding: Crypto.CryptoEncoding.BASE64URL }
      );

      const request = new AuthSession.AuthRequest({
        clientId: CLIENT_ID,
        scopes: SCOPES,
        redirectUri: REDIRECT_URI,
        responseType: AuthSession.ResponseType.Code,
        codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success' && result.params.code) {
        // تبديل رمز التفويض بـ access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: result.params.code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
          code_verifier: codeChallenge,
        });

        this.accessToken = tokenResponse.data.access_token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('خطأ في المصادقة:', error);
      return false;
    }
  }

  // قراءة البيانات من جدول البيانات
  async readData(range: string): Promise<any[]> {
    if (!this.accessToken) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }

    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.data.values || [];
    } catch (error) {
      console.error('خطأ في قراءة البيانات:', error);
      throw error;
    }
  }

  // كتابة البيانات إلى جدول البيانات
  async writeData(range: string, values: any[][]): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }

    try {
      await axios.put(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`,
        {
          values: values,
          majorDimension: 'ROWS',
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            valueInputOption: 'USER_ENTERED',
          },
        }
      );

      return true;
    } catch (error) {
      console.error('خطأ في كتابة البيانات:', error);
      throw error;
    }
  }

  // إضافة صف جديد إلى جدول البيانات
  async appendData(range: string, values: any[]): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }

    try {
      await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append`,
        {
          values: [values],
          majorDimension: 'ROWS',
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
          },
        }
      );

      return true;
    } catch (error) {
      console.error('خطأ في إضافة البيانات:', error);
      throw error;
    }
  }

  // حفظ بيانات المبيعات
  async saveSaleData(saleData: {
    bookTitle: string;
    quantity: number;
    price: number;
    total: number;
    date: string;
    customerName?: string;
  }): Promise<boolean> {
    const values = [
      saleData.date,
      saleData.bookTitle,
      saleData.quantity,
      saleData.price,
      saleData.total,
      saleData.customerName || '',
    ];

    return await this.appendData('Sales!A:F', values);
  }

  // حفظ بيانات المخزون
  async saveInventoryData(inventoryData: {
    bookTitle: string;
    author: string;
    isbn: string;
    quantity: number;
    price: number;
    category: string;
  }): Promise<boolean> {
    const values = [
      inventoryData.bookTitle,
      inventoryData.author,
      inventoryData.isbn,
      inventoryData.quantity,
      inventoryData.price,
      inventoryData.category,
    ];

    return await this.appendData('Inventory!A:F', values);
  }

  // جلب بيانات المبيعات
  async getSalesData(): Promise<any[]> {
    return await this.readData('Sales!A:F');
  }

  // جلب بيانات المخزون
  async getInventoryData(): Promise<any[]> {
    return await this.readData('Inventory!A:F');
  }
}

export default new GoogleSheetsService();


  // جلب الملخص المالي والإحصائيات
  async getFinancialSummary(): Promise<{
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
    totalBooksSold: number;
    totalBooksInStock: number;
  }> {
    try {
      const salesData = await this.getSalesData();
      const inventoryData = await this.getInventoryData();

      let totalRevenue = 0;
      let totalCost = 0;
      let totalBooksSold = 0;

      // حساب إجمالي المبيعات والتكلفة والكتب المباعة
      salesData.slice(1).forEach((row: any[]) => {
        if (row.length >= 5) {
          const quantity = parseFloat(row[2]) || 0;
          const price = parseFloat(row[3]) || 0;
          const total = parseFloat(row[4]) || 0;
          
          totalRevenue += total;
          totalBooksSold += quantity;
          
          // تقدير التكلفة (يمكن تحسين هذا بناءً على بيانات أكثر دقة)
          totalCost += quantity * (price * 0.7); // افتراض أن التكلفة 70% من سعر البيع
        }
      });

      // حساب إجمالي الكتب في المخزون
      let totalBooksInStock = 0;
      inventoryData.slice(1).forEach((row: any[]) => {
        if (row.length >= 4) {
          const quantity = parseFloat(row[3]) || 0;
          totalBooksInStock += quantity;
        }
      });

      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      return {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin,
        totalBooksSold,
        totalBooksInStock,
      };
    } catch (error) {
      console.error('خطأ في جلب الملخص المالي:', error);
      throw error;
    }
  }

  // جلب الكتب الأكثر مبيعاً
  async getBestSellingBooks(limit: number = 5): Promise<Array<{
    bookTitle: string;
    totalSold: number;
    totalRevenue: number;
  }>> {
    try {
      const salesData = await this.getSalesData();
      const bookSales: { [key: string]: { totalSold: number; totalRevenue: number } } = {};

      // تجميع المبيعات حسب الكتاب
      salesData.slice(1).forEach((row: any[]) => {
        if (row.length >= 5) {
          const bookTitle = row[1] || '';
          const quantity = parseFloat(row[2]) || 0;
          const total = parseFloat(row[4]) || 0;

          if (bookTitle) {
            if (!bookSales[bookTitle]) {
              bookSales[bookTitle] = { totalSold: 0, totalRevenue: 0 };
            }
            bookSales[bookTitle].totalSold += quantity;
            bookSales[bookTitle].totalRevenue += total;
          }
        }
      });

      // تحويل إلى مصفوفة وترتيب حسب الكمية المباعة
      const sortedBooks = Object.entries(bookSales)
        .map(([bookTitle, data]) => ({
          bookTitle,
          totalSold: data.totalSold,
          totalRevenue: data.totalRevenue,
        }))
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, limit);

      return sortedBooks;
    } catch (error) {
      console.error('خطأ في جلب الكتب الأكثر مبيعاً:', error);
      throw error;
    }
  }

  // جلب المبيعات الأخيرة
  async getRecentSales(limit: number = 5): Promise<Array<{
    date: string;
    bookTitle: string;
    quantity: number;
    total: number;
    customerName: string;
  }>> {
    try {
      const salesData = await this.getSalesData();
      
      // أخذ آخر المبيعات (تخطي العنوان)
      const recentSales = salesData
        .slice(1)
        .slice(-limit)
        .reverse()
        .map((row: any[]) => ({
          date: row[0] || '',
          bookTitle: row[1] || '',
          quantity: parseFloat(row[2]) || 0,
          total: parseFloat(row[4]) || 0,
          customerName: row[5] || '',
        }));

      return recentSales;
    } catch (error) {
      console.error('خطأ في جلب المبيعات الأخيرة:', error);
      throw error;
    }
  }

  // جلب حالة المخزون (الكتب القليلة أو النافدة)
  async getInventoryStatus(): Promise<{
    lowStock: Array<{ bookTitle: string; quantity: number; threshold: number }>;
    outOfStock: Array<{ bookTitle: string }>;
    totalBooks: number;
    totalValue: number;
  }> {
    try {
      const inventoryData = await this.getInventoryData();
      const lowStockThreshold = 5; // عتبة المخزون القليل
      
      const lowStock: Array<{ bookTitle: string; quantity: number; threshold: number }> = [];
      const outOfStock: Array<{ bookTitle: string }> = [];
      let totalBooks = 0;
      let totalValue = 0;

      inventoryData.slice(1).forEach((row: any[]) => {
        if (row.length >= 5) {
          const bookTitle = row[0] || '';
          const quantity = parseFloat(row[3]) || 0;
          const price = parseFloat(row[4]) || 0;

          totalBooks += quantity;
          totalValue += quantity * price;

          if (quantity === 0) {
            outOfStock.push({ bookTitle });
          } else if (quantity <= lowStockThreshold) {
            lowStock.push({ bookTitle, quantity, threshold: lowStockThreshold });
          }
        }
      });

      return {
        lowStock,
        outOfStock,
        totalBooks,
        totalValue,
      };
    } catch (error) {
      console.error('خطأ في جلب حالة المخزون:', error);
      throw error;
    }
  }

  // جلب تقرير المبيعات الشهري
  async getMonthlySalesReport(year?: number, month?: number): Promise<Array<{
    date: string;
    totalSales: number;
    totalProfit: number;
    booksSold: number;
  }>> {
    try {
      const salesData = await this.getSalesData();
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || currentDate.getMonth() + 1;

      const dailySales: { [key: string]: { totalSales: number; totalProfit: number; booksSold: number } } = {};

      salesData.slice(1).forEach((row: any[]) => {
        if (row.length >= 5) {
          const dateStr = row[0] || '';
          const quantity = parseFloat(row[2]) || 0;
          const price = parseFloat(row[3]) || 0;
          const total = parseFloat(row[4]) || 0;

          // تحليل التاريخ
          const saleDate = new Date(dateStr);
          if (saleDate.getFullYear() === targetYear && saleDate.getMonth() + 1 === targetMonth) {
            const dayKey = saleDate.toISOString().split('T')[0];
            
            if (!dailySales[dayKey]) {
              dailySales[dayKey] = { totalSales: 0, totalProfit: 0, booksSold: 0 };
            }

            dailySales[dayKey].totalSales += total;
            dailySales[dayKey].totalProfit += total - (quantity * price * 0.7); // تقدير الربح
            dailySales[dayKey].booksSold += quantity;
          }
        }
      });

      // تحويل إلى مصفوفة مرتبة حسب التاريخ
      const sortedReport = Object.entries(dailySales)
        .map(([date, data]) => ({
          date,
          totalSales: data.totalSales,
          totalProfit: data.totalProfit,
          booksSold: data.booksSold,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return sortedReport;
    } catch (error) {
      console.error('خطأ في جلب تقرير المبيعات الشهري:', error);
      throw error;
    }
  }

