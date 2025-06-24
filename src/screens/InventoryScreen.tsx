import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, TextInput, Button, DataTable, Chip, ActivityIndicator } from 'react-native-paper';
import { dataStore } from '../store/dataStore';
import { Book } from '../types';
import GoogleSheetsService from '../services/GoogleSheetsService';

export default function InventoryScreen() {
  const [formData, setFormData] = useState({
    name: '',
    author: '',
    isbn: '',
    pricePerUnit: '',
    quantity: '',
    category: '',
  });

  const [books, setBooks] = useState<Book[]>(dataStore.getBooks());
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // تحميل البيانات عند بدء التطبيق
    loadInventoryData();
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
      const sheetsData = await GoogleSheetsService.getInventoryData();
      
      // تحديث البيانات المحلية (يمكن تحسين هذا لتجنب التكرار)
      console.log('بيانات المخزون من Google Sheets:', sheetsData);
      
      Alert.alert('نجح', 'تم مزامنة بيانات المخزون مع Google Sheets');
    } catch (error) {
      console.error('خطأ في مزامنة المخزون:', error);
      Alert.alert('خطأ', 'فشل في مزامنة بيانات المخزون مع Google Sheets');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadInventoryData = () => {
    setBooks(dataStore.getBooks());
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.pricePerUnit || !formData.quantity) {
      Alert.alert('خطأ', 'يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    setIsLoading(true);
    try {
      const pricePerUnit = parseFloat(formData.pricePerUnit);
      const quantity = parseFloat(formData.quantity);
      const totalCost = pricePerUnit * quantity;
      
      const bookData: Book = {
        id: editingBook ? editingBook.id : Date.now().toString(),
        name: formData.name,
        pricePerUnit,
        quantity,
        totalCost,
      };

      // حفظ محلياً
      await dataStore.addBook(bookData);
      
      // حفظ في Google Sheets إذا كان المستخدم مسجل الدخول
      if (isAuthenticated) {
        try {
          await GoogleSheetsService.saveInventoryData({
            bookTitle: formData.name,
            author: formData.author || 'غير محدد',
            isbn: formData.isbn || 'غير محدد',
            quantity: quantity,
            price: pricePerUnit,
            category: formData.category || 'عام',
          });
          
          Alert.alert('نجح', editingBook ? 
            'تم تحديث الكتاب محلياً وفي Google Sheets!' : 
            'تم إضافة الكتاب محلياً وفي Google Sheets!');
        } catch (error) {
          console.error('خطأ في حفظ البيانات في Google Sheets:', error);
          Alert.alert('تحذير', editingBook ? 
            'تم تحديث الكتاب محلياً، لكن فشل في تحديثه في Google Sheets' :
            'تم إضافة الكتاب محلياً، لكن فشل في إضافته إلى Google Sheets');
        }
      } else {
        Alert.alert('نجح', editingBook ? 
          'تم تحديث الكتاب محلياً! (سجل الدخول إلى Google Sheets للمزامنة)' :
          'تم إضافة الكتاب محلياً! (سجل الدخول إلى Google Sheets للمزامنة)');
      }
      
      setBooks(dataStore.getBooks());
      
      // Reset form
      setFormData({
        name: '',
        author: '',
        isbn: '',
        pricePerUnit: '',
        quantity: '',
        category: '',
      });
      
      setShowForm(false);
      setEditingBook(null);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ الكتاب');
      console.error('خطأ في حفظ الكتاب:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (book: Book) => {
    setFormData({
      name: book.name,
      author: '',
      isbn: '',
      pricePerUnit: book.pricePerUnit.toString(),
      quantity: book.quantity.toString(),
      category: '',
    });
    setEditingBook(book);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setFormData({
      name: '',
      author: '',
      isbn: '',
      pricePerUnit: '',
      quantity: '',
      category: '',
    });
    setEditingBook(null);
    setShowForm(false);
  };

  const totalInventoryValue = books.reduce((sum, book) => sum + book.totalCost, 0);
  const totalBooks = books.reduce((sum, book) => sum + book.quantity, 0);

  const getStatusChip = (quantity: number) => {
    if (quantity > 10) {
      return <Chip style={{ backgroundColor: '#d1fae5' }} textStyle={{ color: '#065f46' }}>متوفر</Chip>;
    } else if (quantity > 0) {
      return <Chip style={{ backgroundColor: '#fef3c7' }} textStyle={{ color: '#92400e' }}>قليل</Chip>;
    } else {
      return <Chip style={{ backgroundColor: '#fee2e2' }} textStyle={{ color: '#991b1b' }}>نفد</Chip>;
    }
  };

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
          {showForm ? 'إلغاء' : 'إضافة كتاب جديد'}
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

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard} elevation={2}>
          <Card.Content style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>قيمة المخزون</Text>
            <Text style={styles.summaryValue}>{totalInventoryValue.toFixed(2)}</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.summaryCard} elevation={2}>
          <Card.Content style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>إجمالي الكتب</Text>
            <Text style={styles.summaryValue}>{totalBooks}</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.summaryCard} elevation={2}>
          <Card.Content style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>أنواع الكتب</Text>
            <Text style={styles.summaryValue}>{books.length}</Text>
          </Card.Content>
        </Card>
      </View>

      {showForm && (
        <Card style={styles.formCard} elevation={3}>
          <Card.Title title={editingBook ? 'تعديل الكتاب' : 'إضافة كتاب جديد'} />
          <Card.Content>
            <TextInput
              label="اسم الكتاب *"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              style={styles.input}
              mode="outlined"
              disabled={isLoading}
            />

            <TextInput
              label="المؤلف"
              value={formData.author}
              onChangeText={(value) => handleInputChange('author', value)}
              style={styles.input}
              mode="outlined"
              disabled={isLoading}
            />

            <TextInput
              label="ISBN"
              value={formData.isbn}
              onChangeText={(value) => handleInputChange('isbn', value)}
              style={styles.input}
              mode="outlined"
              disabled={isLoading}
            />

            <TextInput
              label="سعر الوحدة (ريال) *"
              value={formData.pricePerUnit}
              onChangeText={(value) => handleInputChange('pricePerUnit', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              disabled={isLoading}
            />

            <TextInput
              label="الكمية *"
              value={formData.quantity}
              onChangeText={(value) => handleInputChange('quantity', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              disabled={isLoading}
            />

            <TextInput
              label="الفئة"
              value={formData.category}
              onChangeText={(value) => handleInputChange('category', value)}
              style={styles.input}
              mode="outlined"
              disabled={isLoading}
            />

            <Card style={styles.calculationCard}>
              <Card.Content>
                <Text style={styles.calculationTitle}>التكلفة الإجمالية</Text>
                <Text style={styles.calculationValue}>
                  {((parseFloat(formData.pricePerUnit) || 0) * (parseFloat(formData.quantity) || 0)).toFixed(2)} ريال
                </Text>
              </Card.Content>
            </Card>

            <View style={styles.buttonContainer}>
              {editingBook && (
                <Button mode="outlined" onPress={cancelEdit} style={styles.cancelButton} disabled={isLoading}>
                  إلغاء
                </Button>
              )}
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                icon="content-save"
                disabled={isLoading}
              >
                {isLoading ? 'جاري الحفظ...' : (editingBook ? 'تحديث' : 'حفظ')}
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.tableCard} elevation={3}>
        <Card.Title title="قائمة الكتب" />
        <Card.Content>
          {books.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد كتب مضافة بعد</Text>
          ) : (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>اسم الكتاب</DataTable.Title>
                <DataTable.Title numeric>السعر</DataTable.Title>
                <DataTable.Title numeric>الكمية</DataTable.Title>
                <DataTable.Title>الحالة</DataTable.Title>
              </DataTable.Header>

              {books.map((book) => (
                <DataTable.Row key={book.id} onPress={() => handleEdit(book)}>
                  <DataTable.Cell>{book.name}</DataTable.Cell>
                  <DataTable.Cell numeric>{book.pricePerUnit.toFixed(2)}</DataTable.Cell>
                  <DataTable.Cell numeric>{book.quantity}</DataTable.Cell>
                  <DataTable.Cell>{getStatusChip(book.quantity)}</DataTable.Cell>
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
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  formCard: {
    margin: 16,
    marginTop: 0,
  },
  input: {
    marginBottom: 12,
  },
  calculationCard: {
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  calculationValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
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

