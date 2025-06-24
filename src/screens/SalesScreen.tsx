import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, TextInput, Button, DataTable } from 'react-native-paper';
import { dataStore } from '../store/dataStore';
import { Sale } from '../types';

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

    await dataStore.addSale(newSale);
    await dataStore.updateBookQuantity(formData.bookName, parseFloat(formData.quantity));
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
    Alert.alert('نجح', 'تم حفظ المبيعة بنجاح!');
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
        >
          {showForm ? 'إلغاء' : 'إضافة مبيعة جديدة'}
        </Button>
      </View>

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
            />

            <TextInput
              label="اسم الكتاب"
              value={formData.bookName}
              onChangeText={(value) => handleInputChange('bookName', value)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="الكمية"
              value={formData.quantity}
              onChangeText={(value) => handleInputChange('quantity', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="السعر الجملة (ريال)"
              value={formData.wholesalePrice}
              onChangeText={(value) => handleInputChange('wholesalePrice', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="سعر البيع (ريال)"
              value={formData.sellingPrice}
              onChangeText={(value) => handleInputChange('sellingPrice', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
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
            >
              حفظ المبيعة
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