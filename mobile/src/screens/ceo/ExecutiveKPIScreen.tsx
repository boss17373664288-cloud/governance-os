import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ExecutiveKPIScreen({ navigation }: any) {
  const companyKPI = [
    { label: '今日营收', value: '¥285,000', change: '+18%' },
    { label: '本月利润', value: '¥3,250,000', change: '+12%' },
    { label: '应收逾期', value: '¥890,000', change: '-5%' },
    { label: '库存总值', value: '¥12,500,000', change: '+3%' },
  ];

  const deptRanking = [
    { dept: '北区业务部', revenue: '¥1,200,000', rate: '38%' },
    { dept: '南区业务部', revenue: '¥980,000', rate: '31%' },
    { dept: '学术推广部', revenue: '¥650,000', rate: '22%' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📈 高管看板</Text>
      <View style={styles.kpiGrid}>
        {companyKPI.map(k => (
          <View key={k.label} style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
            <Text style={[styles.kpiChange, { color: k.change.startsWith('+') ? '#16a34a' : '#ef4444' }]}>{k.change}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>部门业绩排行</Text>
      {deptRanking.map((d, i) => (
        <View key={d.dept} style={styles.deptRow}>
          <Text style={styles.deptRank}>{i + 1}</Text>
          <View style={styles.deptInfo}>
            <Text style={styles.deptName}>{d.dept}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: d.rate }]} />
            </View>
          </View>
          <Text style={styles.deptRevenue}>{d.revenue}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  kpiCard: { width: '47%', backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center' },
  kpiValue: { fontSize: 20, fontWeight: '700', color: '#333' },
  kpiLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  kpiChange: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  deptRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 6, gap: 10 },
  deptRank: { fontSize: 16, fontWeight: '700', color: '#3b82f6', width: 24 },
  deptInfo: { flex: 1 },
  deptName: { fontSize: 13, fontWeight: '600', color: '#333' },
  progressBar: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, marginTop: 4 },
  progressFill: { height: 6, backgroundColor: '#3b82f6', borderRadius: 3 },
  deptRevenue: { fontSize: 13, fontWeight: '600', color: '#333' },
});
