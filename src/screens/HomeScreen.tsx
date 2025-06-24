import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatCard } from '../components/StatCard';
import { dataStore } from '../store/dataStore';
import GoogleSheetsService from '../services/GoogleSheetsService';

export default function HomeScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [report, setReport] = useState(dataStore.generateReport());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleSheetsData, setGoogleSheetsData] = useState<any>(null);

  useEffect(() => {
    // تحميل البيانات عند بدء التطبيق
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
      const financialSummary = await GoogleSheetsService.getFinancialSummary();
      setGoogleSheetsData(financialSummary);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadData();
    if (isAuthenticated) {
      await loadGoogleSheetsData();
    }
    setRefreshing(false);
  }, [isAuthenticated]);

  // استخدام بيانات Google Sheets إذا كانت متوفرة، وإلا استخدام البيانات المحلية
  const displayData = googleSheetsData || {
    totalProfit: report.totalProfit,
    totalRevenue: report.totalRevenue,
    totalBooksSold: report.totalBooksSold,
    totalBooksInStock: report.totalBooksRemaining,
  };

  const stats = [
    {
      title: 'إجمالي الأرباح',
      value: displayData.totalProfit.toFixed(2),
      icon: 'trending-up' as const,
      colors: ['#10b981', '#059669'],
    },
    {
      title: 'الكتب المباعة',
      value: displayData.totalBooksSold.toString(),
      icon: 'cart' as const,
      colors: ['#2563eb', '#1d4ed8'],
    },
    {
      title: 'الكتب المتبقية',
      value: displayData.totalBooksInStock.toString(),
      icon: 'library' as const,
      colors: ['#f59e0b', '#d97706'],
    },
    {
      title: 'إجمالي المبيعات',
      value: displayData.totalRevenue.toFixed(2),
      icon: 'bar-chart' as const,
      colors: ['#8b5cf6', '#7c3aed'],
    },
  ];

  const quickActions = [
    {
      title: 'إضافة مبيعة جديدة',
      description: 'تسجيل عملية بيع جديدة للعملاء',
      screen: 'Sales',
      icon: 'add-circle',
      colors: ['#2563eb', '#1d4ed8'],
    },
    {
      title: 'إدارة المخزون',
      description: 'إضافة وتعديل معلومات الكتب',
      screen: 'Inventory',
      icon: 'library',
      colors: ['#10b981', '#059669'],
    },
    {
      title: 'عرض التقارير',
      description: 'تقارير شاملة عن الأرباح والمبيعات',
      screen: 'Reports',
      icon: 'analytics',
      colors: ['#f59e0b', '#d97706'],
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
              {isLoading ? 'جاري التحديث...' : 'تحديث البيانات'}
            </Button>
          </View>
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <StatCard {...stat} />
          </View>
        ))}
      </View>

      {/* مؤشر مصدر البيانات */}
      <View style={styles.dataSourceIndicator}>
        <Text style={styles.dataSourceText}>
          {googleSheetsData ? '📊 البيانات من Google Sheets' : '💾 البيانات المحلية'}
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>الإجراءات السريعة</Text>
        {quickActions.map((action, index) => (
          <Card key={index} style={styles.actionCard} elevation={2}>
            <LinearGradient colors={action.colors} style={styles.actionGradient}>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate(action.screen)}
                  style={styles.actionButton}
                  buttonColor="rgba(255, 255, 255, 0.2)"
                  textColor="#ffffff"
                >
                  انتقال
                </Button>
              </View>
            </LinearGradient>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  actionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
  },
  actionContent: {
    alignItems: 'center',
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  actionDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: 8,
  },
});

