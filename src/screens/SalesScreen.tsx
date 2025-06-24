import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, TextInput, Button, DataTable, ActivityIndicator } from 'react-native-paper';
import { dataStore } from '../store/dataStore';
import { Sale } from '../types';
import GoogleSheetsService from '../services/GoogleSheetsService';

export default function SalesScreen() {
  const [formData, setFormData] = useState({
    customerName: '',
    bookName: '',
    quantity: '1',
    wholesalePrice: '',
    sellingPrice: '',
  });

  const [sales, setSales] = useState<Sale[]>(dataStore.getSales());
  const [showForm, setShowForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // تحميل البيانات عند بدء التطبيق
    loadSalesData();
  }, []);

  const handleGoogleSheetsAuth = async () => {
    setIsLoading(true);
    try {
      const success = await GoogleSheetsService.authenticate();
      if (success) {
        setIsAuthenticated(true);
        Alert.alert('نجح', 'تم تسجيل الدخول إلى Google Sheets بنجاح!');
        await syncWithGoogleSheets();
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

  const syncWithGoogleSheets = async () => {
    if (!isAuthenticated) return;
    
    setIsSyncing(true);
    try {
      // جلب البيانات من Google Sheets
      const sheetsData = await GoogleSheetsService.getSalesData();
      
      // تحديث البيانات المحلية (يمكن تحسين هذا لتجنب التكرار)
      console.log('بيانات من Google Sheets:', sheetsData);
      
      Alert.alert('نجح', 'تم مزامنة البيانات مع Google Sheets');
    } catch (error) {
      console.error('خطأ في المزامنة:', error);
      Alert.alert('خطأ', 'فشل في مزامنة البيانات مع Google Sheets');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadSalesData = () => {
    setSales(dataStore.getSales());
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotals = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const wholesalePrice = parseFloat(formData.wholesalePrice) || 0;
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    
    const totalCost = quantity * wholesalePrice;
    const totalRevenue = quantity * sellingPrice;
    const profit = totalRevenue - totalCost;
    
    return { totalCost, totalRevenue, profit };
  };

  const handleSubmit = async () => {
    if (!formData.customerName || !formData.bookName || !formData.quantity) {
      Alert.alert('خطأ', 'يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    setIsLoading(true);
    try {
      const { totalCost, profit } = calculateTotals();
      
      const newSale: Sale = {
        id: Date.now().toString(),
        customerName: formData.customerName,
        bookName: formData.bookName,
        quantity: parseFloat(formData.quantity),
        wholesalePrice: parseFloat(formData.wholesalePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        totalCost,
        profit,
        date: new Date().toISOString(),
      };

      // حفظ محلياً
      await dataStore.addSale(newSale);
      await dataStore.updateBookQuantity(formData.bookName, parseFloat(formData.quantity));
      
      // حفظ في Google Sheets إذا كان المستخدم مسجل الدخول
      if (isAuthenticated) {
        try {
          await GoogleSheetsService.saveSaleData({
            bookTitle: newSale.bookName,
            quantity: newSale.quantity,
            price: newSale.sellingPrice,
            total: newSale.quantity * newSale.sellingPrice,
            date: new Date(newSale.date).toLocaleDateString('ar-SA'),
            customerName: newSale.customerName,
          });
          
          Alert.alert('نجح', 'تم حفظ المبيعة محلياً وفي Google Sheets!');
        } catch (error) {
          console.error('خطأ في حفظ البيانات في Google Sheets:', error);
          Alert.alert('تحذير', 'تم حفظ المبيعة محلياً، لكن فشل في حفظها في Google Sheets');
        }
      } else {
        Alert.alert('نجح', 'تم حفظ المبيعة محلياً! (سجل الدخول إلى Google Sheets للمزامنة)');
      }
      
      setSales(dataStore.getSales());
      
      // Reset form
      setFormData({
        customerName: '',
        bookName: '',
        quantity: '1',
        wholesalePrice: '',
        sellingPrice: '',
      });
      
      setShowForm(false);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ المبيعة');
      console.error('خطأ في حفظ المبيعة:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const { totalCost, totalRevenue, profit } = calculateTotals();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button
          mode={showForm ? "outlined" : "contained"}
          onPress={() => setShowForm(!showForm)}
          style={styles.toggleButton}
          icon={showForm ? "close" : "plus"}
          disabled={isLoading}
        >
          {showForm ? 'إلغاء' : 'إضافة مبيعة جديدة'}
        </Button>

        {/* أزرار Google Sheets */}
        <View style={styles.googleSheetsButtons}>
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
            <View style={styles.authenticatedButtons}>
              <Text style={styles.authStatus}>✅ متصل بـ Google Sheets</Text>
              <Button
                mode="outlined"
                onPress={syncWithGoogleSheets}
                style={styles.syncButton}
                icon="sync"
                disabled={isSyncing}
              >
                {isSyncing ? 'جاري المزامنة...' : 'مزامنة البيانات'}
              </Button>
            </View>
          )}
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>جاري المعالجة...</Text>
        </View>
      )}

      {showForm && (
        <Card style={styles.formCard} elevation={3}>
          <Card.Title title="تسجيل مبيعة جديدة" />
          <Card.Content>
            <TextInput
              label="اسم العميل"
              value={formData.customerName}
              onChangeText={(value) => handleInputChange('customerName', value)}
              style={styles.input}
              mode="outlined"
              disabled={isLoading}
            />

            <TextInput
              label="اسم الكتاب"
              value={formData.bookName}
              onChangeText={(value) => handleInputChange('bookName', value)}
              style={styles.input}
              mode="outlined"
              disabled={isLoading}
            />

            <TextInput
              label="الكمية"
              value={formData.quantity}
              onChangeText={(value) => handleInputChange('quantity', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              disabled={isLoading}
            />

            <TextInput
              label="السعر الجملة (ريال)"
              value={formData.wholesalePrice}
              onChangeText={(value) => handleInputChange('wholesalePrice', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              disabled={isLoading}
            />

            <TextInput
              label="سعر البيع (ريال)"
              value={formData.sellingPrice}
              onChangeText={(value) => handleInputChange('sellingPrice', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              disabled={isLoading}
            />

            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryTitle}>ملخص العملية</Text>
                <View style={styles.summaryRow}>
                  <Text>التكلفة الإجمالية:</Text>
                  <Text style={styles.summaryValue}>{totalCost.toFixed(2)} ريال</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text>إجمالي البيع:</Text>
                  <Text style={styles.summaryValue}>{totalRevenue.toFixed(2)} ريال</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text>الربح:</Text>
                  <Text style={[styles.summaryValue, { color: profit >= 0 ? '#10b981' : '#dc2626' }]}>
                    {profit.toFixed(2)} ريال
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              icon="content-save"
              disabled={isLoading}
            >
              {isLoading ? 'جاري الحفظ...' : 'حفظ المبيعة'}
            </Button>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.tableCard} elevation={3}>
        <Card.Title title="سجل المبيعات" />
        <Card.Content>
          {sales.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد مبيعات مسجلة بعد</Text>
          ) : (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>العميل</DataTable.Title>
                <DataTable.Title>الكتاب</DataTable.Title>
                <DataTable.Title numeric>الكمية</DataTable.Title>
                <DataTable.Title numeric>الربح</DataTable.Title>
              </DataTable.Header>

              {sales.slice(-10).reverse().map((sale) => (
                <DataTable.Row key={sale.id}>
                  <DataTable.Cell>{sale.customerName}</DataTable.Cell>
                  <DataTable.Cell>{sale.bookName}</DataTable.Cell>
                  <DataTable.Cell numeric>{sale.quantity}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text style={{ color: sale.profit >= 0 ? '#10b981' : '#dc2626' }}>
                      {sale.profit.toFixed(2)}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
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
    padding: 16,
  },
  toggleButton: {
    marginBottom: 8,
  },
  googleSheetsButtons: {
    marginTop: 8,
  },
  authButton: {
    marginBottom: 8,
  },
  authenticatedButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  authStatus: {
    color: '#10b981',
    fontWeight: 'bold',
    textAlign: 'center',
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
  formCard: {
    margin: 16,
    marginTop: 0,
  },
  input: {
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 16,
  },
  tableCard: {
    margin: 16,
    marginTop: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
    padding: 20,
  },
});

