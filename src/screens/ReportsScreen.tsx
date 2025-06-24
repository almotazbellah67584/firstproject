import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, DataTable, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatCard } from '../components/StatCard';
import { dataStore } from '../store/dataStore';
import GoogleSheetsService from '../services/GoogleSheetsService';

export default function ReportsScreen() {
  const [report, setReport] = useState(dataStore.generateReport());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleSheetsData, setGoogleSheetsData] = useState<any>(null);
  const [bestSellingBooks, setBestSellingBooks] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<any>(null);

  const sales = dataStore.getSales();
  const books = dataStore.getBooks();

  useEffect(() => {
    loadData();
  }, []);

  const handleGoogleSheetsAuth = async () => {
    setIsLoading(true);
    try {
      const success = await GoogleSheetsService.authenticate();
      if (success) {
        setIsAuthenticated(true);
        Alert.alert('نجح', 'تم تسجيل الدخول إلى Google Sheets بنجاح!');
        await loadGoogleSheetsData();
      } else {
        Alert.alert('خطأ', 'فشل في تسجيل الدخول إلى Google Sheets');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول');
      console.error('خطأ في المصادقة:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoogleSheetsData = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      // جلب الملخص المالي
      const financialSummary = await GoogleSheetsService.getFinancialSummary();
      setGoogleSheetsData(financialSummary);

      // جلب الكتب الأكثر مبيعاً
      const bestSelling = await GoogleSheetsService.getBestSellingBooks(5);
      setBestSellingBooks(bestSelling);

      // جلب المبيعات الأخيرة
      const recent = await GoogleSheetsService.getRecentSales(5);
      setRecentSales(recent);

      // جلب حالة المخزون
      const inventory = await GoogleSheetsService.getInventoryStatus();
      setInventoryStatus(inventory);

    } catch (error) {
      console.error('خطأ في جلب البيانات من Google Sheets:', error);
      Alert.alert('خطأ', 'فشل في جلب البيانات من Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = () => {
    setReport(dataStore.generateReport());
  };

  const refreshReport = async () => {
    loadData();
    if (isAuthenticated) {
      await loadGoogleSheetsData();
    }
  };

  const generateDetailedReport = () => {
    const displayData = googleSheetsData || {
      totalProfit: report.totalProfit,
      totalRevenue: report.totalRevenue,
      totalCost: report.totalCost,
      totalBooksSold: report.totalBooksSold,
      totalBooksInStock: report.totalBooksRemaining,
      profitMargin: report.totalRevenue > 0 ? ((report.totalProfit / report.totalRevenue) * 100) : 0
    };

    const reportData = {
      generatedAt: new Date().toLocaleString('ar-SA'),
      summary: {
        totalProfit: displayData.totalProfit,
        totalRevenue: displayData.totalRevenue,
        totalCost: displayData.totalCost,
        totalBooksSold: displayData.totalBooksSold,
        totalBooksRemaining: displayData.totalBooksInStock,
        profitMargin: displayData.profitMargin || (displayData.totalRevenue > 0 ? ((displayData.totalProfit / displayData.totalRevenue) * 100).toFixed(2) : 0)
      },
      dataSource: googleSheetsData ? 'Google Sheets' : 'البيانات المحلية'
    };

    Alert.alert(
      'تقرير شامل',
      `تاريخ التقرير: ${reportData.generatedAt}\nمصدر البيانات: ${reportData.dataSource}\n\nالملخص المالي:\nإجمالي الأرباح: ${reportData.summary.totalProfit.toFixed(2)} ريال\nإجمالي المبيعات: ${reportData.summary.totalRevenue.toFixed(2)} ريال\nهامش الربح: ${reportData.summary.profitMargin}%\n\nإحصائيات المخزون:\nالكتب المباعة: ${reportData.summary.totalBooksSold}\nالكتب المتبقية: ${reportData.summary.totalBooksRemaining}`,
      [{ text: 'موافق' }]
    );
  };

  // استخدام بيانات Google Sheets إذا كانت متوفرة، وإلا استخدام البيانات المحلية
  const displayData = googleSheetsData || {
    totalProfit: report.totalProfit,
    totalRevenue: report.totalRevenue,
    totalCost: report.totalCost,
    totalBooksSold: report.totalBooksSold,
    totalBooksInStock: report.totalBooksRemaining,
    profitMargin: report.totalRevenue > 0 ? ((report.totalProfit / report.totalRevenue) * 100) : 0
  };

  const reportCards = [
    {
      title: 'صافي الأرباح',
      value: `${displayData.totalProfit.toFixed(2)} ريال`,
      icon: 'trending-up' as const,
      colors: ['#10b981', '#059669'],
    },
    {
      title: 'إجمالي المبيعات',
      value: `${displayData.totalRevenue.toFixed(2)} ريال`,
      icon: 'cash' as const,
      colors: ['#2563eb', '#1d4ed8'],
    },
    {
      title: 'الكتب المباعة',
      value: displayData.totalBooksSold.toString(),
      icon: 'cart' as const,
      colors: ['#3b82f6', '#2563eb'],
    },
    {
      title: 'الكتب المتبقية',
      value: displayData.totalBooksInStock.toString(),
      icon: 'library' as const,
      colors: ['#f59e0b', '#d97706'],
    },
  ];

  // استخدام بيانات Google Sheets للكتب الأكثر مبيعاً أو البيانات المحلية
  const displayBestSelling = bestSellingBooks.length > 0 ? bestSellingBooks : (() => {
    const bookSales = sales.reduce((acc, sale) => {
      acc[sale.bookName] = (acc[sale.bookName] || 0) + sale.quantity;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(bookSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([bookTitle, totalSold]) => ({ bookTitle, totalSold, totalRevenue: 0 }));
  })();

  // استخدام بيانات Google Sheets للمبيعات الأخيرة أو البيانات المحلية
  const displayRecentSales = recentSales.length > 0 ? recentSales : sales.slice(-5).reverse().map(sale => ({
    date: new Date(sale.date).toLocaleDateString('ar-SA'),
    bookTitle: sale.bookName,
    quantity: sale.quantity,
    total: sale.quantity * sale.sellingPrice,
    customerName: sale.customerName,
  }));

  // استخدام بيانات Google Sheets للمخزون أو البيانات المحلية
  const displayInventory = inventoryStatus ? inventoryStatus : {
    totalBooks: books.reduce((sum, book) => sum + book.quantity, 0),
    totalValue: books.reduce((sum, book) => sum + (book.pricePerUnit * book.quantity), 0),
    lowStock: books.filter(book => book.quantity <= 5 && book.quantity > 0),
    outOfStock: books.filter(book => book.quantity === 0),
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button
          mode="contained"
          onPress={generateDetailedReport}
          style={styles.reportButton}
          icon="download"
          disabled={isLoading}
        >
          تحميل التقرير الشامل
        </Button>
        <Button
          mode="outlined"
          onPress={refreshReport}
          style={styles.refreshButton}
          icon="refresh"
          disabled={isLoading}
        >
          {isLoading ? 'جاري التحديث...' : 'تحديث'}
        </Button>
      </View>

      {/* أزرار Google Sheets */}
      <View style={styles.googleSheetsContainer}>
        {!isAuthenticated ? (
          <Button
            mode="outlined"
            onPress={handleGoogleSheetsAuth}
            style={styles.authButton}
            icon="google"
            disabled={isLoading}
          >
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول إلى Google Sheets'}
          </Button>
        ) : (
          <View style={styles.authenticatedContainer}>
            <Text style={styles.authStatus}>✅ متصل بـ Google Sheets</Text>
            <Button
              mode="outlined"
              onPress={loadGoogleSheetsData}
              style={styles.syncButton}
              icon="sync"
              disabled={isLoading}
            >
              {isLoading ? 'جاري المزامنة...' : 'مزامنة البيانات'}
            </Button>
          </View>
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>جاري تحميل التقارير...</Text>
        </View>
      )}

      {/* Key Metrics */}
      <View style={styles.statsContainer}>
        {reportCards.map((card, index) => (
          <View key={index} style={styles.statCard}>
            <StatCard {...card} />
          </View>
        ))}
      </View>

      {/* مؤشر مصدر البيانات */}
      <View style={styles.dataSourceIndicator}>
        <Text style={styles.dataSourceText}>
          {googleSheetsData ? '📊 البيانات من Google Sheets' : '💾 البيانات المحلية'}
        </Text>
      </View>

      {/* Financial Overview */}
      <Card style={styles.overviewCard} elevation={3}>
        <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.overviewGradient}>
          <Text style={styles.overviewTitle}>الملخص المالي</Text>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{displayData.totalProfit.toFixed(2)} ريال</Text>
              <Text style={styles.overviewLabel}>صافي الأرباح</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{(displayData.profitMargin || 0).toFixed(1)}%</Text>
              <Text style={styles.overviewLabel}>هامش الربح</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{displayData.totalCost.toFixed(2)} ريال</Text>
              <Text style={styles.overviewLabel}>إجمالي التكلفة</Text>
            </View>
          </View>
        </LinearGradient>
      </Card>

      {/* Top Selling Books */}
      <Card style={styles.card} elevation={3}>
        <Card.Title title="الكتب الأكثر مبيعاً" />
        <Card.Content>
          {displayBestSelling.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد مبيعات بعد</Text>
          ) : (
            displayBestSelling.map((book, index) => (
              <View key={book.bookTitle} style={styles.topBookItem}>
                <View style={styles.topBookRank}>
                  <Text style={styles.topBookRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topBookInfo}>
                  <Text style={styles.topBookName}>{book.bookTitle}</Text>
                  <Text style={styles.topBookQuantity}>{book.totalSold} نسخة</Text>
                  {book.totalRevenue > 0 && (
                    <Text style={styles.topBookRevenue}>{book.totalRevenue.toFixed(2)} ريال</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Recent Sales */}
      <Card style={styles.card} elevation={3}>
        <Card.Title title="المبيعات الأخيرة" />
        <Card.Content>
          {displayRecentSales.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد مبيعات بعد</Text>
          ) : (
            displayRecentSales.map((sale, index) => (
              <View key={index} style={styles.recentSaleItem}>
                <View style={styles.recentSaleInfo}>
                  <Text style={styles.recentSaleBook}>{sale.bookTitle}</Text>
                  <Text style={styles.recentSaleCustomer}>{sale.customerName}</Text>
                </View>
                <View style={styles.recentSaleProfit}>
                  <Text style={styles.recentSaleProfitText}>
                    {sale.total.toFixed(2)} ريال
                  </Text>
                  <Text style={styles.recentSaleDate}>{sale.date}</Text>
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Inventory Status */}
      <Card style={styles.card} elevation={3}>
        <Card.Title title="حالة المخزون" />
        <Card.Content>
          {displayInventory.totalBooks === 0 ? (
            <Text style={styles.emptyText}>لا توجد كتب في المخزون</Text>
          ) : (
            <View>
              <View style={styles.inventorySummary}>
                <Text style={styles.inventorySummaryText}>
                  إجمالي الكتب: {displayInventory.totalBooks}
                </Text>
                <Text style={styles.inventorySummaryText}>
                  القيمة الإجمالية: {displayInventory.totalValue.toFixed(2)} ريال
                </Text>
              </View>
              
              {displayInventory.lowStock && displayInventory.lowStock.length > 0 && (
                <View style={styles.inventoryAlert}>
                  <Text style={styles.inventoryAlertTitle}>⚠️ مخزون قليل:</Text>
                  {displayInventory.lowStock.map((item: any, index: number) => (
                    <Text key={index} style={styles.inventoryAlertItem}>
                      • {item.bookTitle || item.name}: {item.quantity} نسخة
                    </Text>
                  ))}
                </View>
              )}
              
              {displayInventory.outOfStock && displayInventory.outOfStock.length > 0 && (
                <View style={styles.inventoryAlert}>
                  <Text style={styles.inventoryAlertTitle}>❌ نفد من المخزون:</Text>
                  {displayInventory.outOfStock.map((item: any, index: number) => (
                    <Text key={index} style={styles.inventoryAlertItem}>
                      • {item.bookTitle || item.name}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  reportButton: {
    flex: 1,
  },
  refreshButton: {
    flex: 1,
  },
  googleSheetsContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  authButton: {
    marginBottom: 8,
  },
  authenticatedContainer: {
    alignItems: 'center',
  },
  authStatus: {
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  syncButton: {
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statCard: {
    width: '50%',
    padding: 4,
  },
  dataSourceIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dataSourceText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  overviewCard: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  overviewGradient: {
    padding: 20,
  },
  overviewTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  overviewLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
    padding: 20,
  },
  topBookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  topBookRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  topBookRankText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  topBookInfo: {
    flex: 1,
  },
  topBookName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  topBookQuantity: {
    fontSize: 14,
    color: '#64748b',
  },
  topBookRevenue: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: 'bold',
  },
  recentSaleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  recentSaleInfo: {
    flex: 1,
  },
  recentSaleBook: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  recentSaleCustomer: {
    fontSize: 12,
    color: '#64748b',
  },
  recentSaleProfit: {
    alignItems: 'flex-end',
  },
  recentSaleProfitText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  recentSaleDate: {
    fontSize: 12,
    color: '#64748b',
  },
  inventorySummary: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  inventorySummaryText: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  inventoryAlert: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  inventoryAlertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  inventoryAlertItem: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 4,
  },
});

