import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function RiskAlertsScreen({ navigation }: any) {
  const alerts = [
    { id: '1', type: '逾期应收', customer: '台大医院', amount: 125000, days: 45, level: '高' },
    { id: '2', type: '寄库呆滞', customer: '忠孝美丽诊所', product: '玻尿酸 100ml', days: 95, level: '高' },
    { id: '3', type: 'Recall影响', batchNo: 'BT-PROD-013-01', orders: 3, level: '中' },
    { id: '4', type: '低价超时', orderNo: 'SO-20260605-003', hours: 48, level: '中' },
    { id: '5', type: '库存低', product: 'N95口罩', qty: 50, level: '低' },
  ];

  const levelColors: Record<string, string> = { '高': '#ef4444', '中': '#f59e0b', '低': '#3b82f6' };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚠️ 风险预警</Text>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#fef2f2' }]}>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>2</Text>
          <Text style={styles.summaryLabel}>高风险</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#fffbeb' }]}>
          <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>2</Text>
          <Text style={styles.summaryLabel}>中风险</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#eff6ff' }]}>
          <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>1</Text>
          <Text style={styles.summaryLabel}>低风险</Text>
        </View>
      </View>
      {alerts.map(a => (
        <View key={a.id} style={[styles.alertCard, { borderLeftColor: levelColors[a.level] }]}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertType}>{a.type}</Text>
            <Text style={[styles.alertLevel, { color: levelColors[a.level] }]}>● {a.level}</Text>
          </View>
          <Text style={styles.alertDetail}>
            {a.customer || a.product || a.batchNo || a.orderNo}
            {a.amount ? ' - ¥' + a.amount.toLocaleString() : ''}
            {a.days ? ' (' + a.days + '天)' : ''}
            {a.orders ? ' (' + a.orders + '笔订单)' : ''}
            {a.qty ? ' (库存' + a.qty + ')' : ''}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700' },
  summaryLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  alertCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, borderLeftWidth: 4 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  alertType: { fontSize: 13, fontWeight: '600', color: '#333' },
  alertLevel: { fontSize: 12, fontWeight: '600' },
  alertDetail: { fontSize: 12, color: '#666' },
});
