import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function CEODashboardScreen() {
  const metrics = [
    { label: '本月营收', value: '2,350,000', color: '#3b82f6' },
    { label: '毛利', value: '1,050,000', color: '#22c55e' },
    { label: '待审批', value: '5', color: '#f59e0b' },
    { label: '逾期应收', value: '3', color: '#ef4444' },
    { label: 'Recall案件', value: '1', color: '#f97316' },
    { label: '库存周转', value: '12.4天', color: '#8b5cf6' },
  ];

  const alerts = [
    { level: 'HIGH', text: '逾期应收 3 笔超过 30 天' },
    { level: 'MEDIUM', text: '1 件 Recall 进行中' },
    { level: 'LOW', text: '库存效期 5 批次 30 天内到期' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>总裁驾驶舱</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('zh-TW', { year:'numeric', month:'long', day:'numeric' })}</Text>
      </View>

      <View style={styles.metricsGrid}>
        {metrics.map(m => (
          <View key={m.label} style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>风险预警</Text>
      {alerts.map((a, i) => (
        <View key={i} style={[styles.alertRow, a.level==='HIGH'?styles.alertHigh:a.level==='MEDIUM'?styles.alertMedium:styles.alertLow]}>
          <View style={[styles.alertDot, { backgroundColor: a.level==='HIGH'?'#ef4444':a.level==='MEDIUM'?'#f59e0b':'#22c55e' }]}></View>
          <Text style={styles.alertText}>{a.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  date: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  metricCard: { width: '30%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, alignItems: 'center' },
  metricValue: { fontSize: 24, fontWeight: 'bold' },
  metricLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#e2e8f0', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  alertRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 10 },
  alertHigh: { backgroundColor: 'rgba(239,68,68,0.15)' },
  alertMedium: { backgroundColor: 'rgba(245,158,11,0.15)' },
  alertLow: { backgroundColor: 'rgba(34,197,94,0.1)' },
  alertDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  alertText: { fontSize: 14, color: '#e2e8f0', flex: 1 },
});