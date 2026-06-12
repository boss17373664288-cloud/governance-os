import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function TeamKPIScreen({ navigation }: any) {
  const kpiData = [
    { label: '拜访次数', value: '127', change: '+12%', color: '#3b82f6' },
    { label: '成交率', value: '34%', change: '+5%', color: '#16a34a' },
    { label: '回款率', value: '89%', change: '-2%', color: '#f59e0b' },
    { label: '打板转单率', value: '22%', change: '+8%', color: '#8b5cf6' },
  ];

  const teamRanking = [
    { name: '张业务', visits: 45, deals: 15, rate: '33%' },
    { name: '李业务', visits: 38, deals: 14, rate: '37%' },
    { name: '王业务', visits: 44, deals: 11, rate: '25%' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 团队KPI看板</Text>
      <View style={styles.kpiGrid}>
        {kpiData.map(k => (
          <View key={k.label} style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
            <Text style={[styles.kpiChange, { color: k.change.startsWith('+') ? '#16a34a' : '#ef4444' }]}>{k.change}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>团队排名 (本月)</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 3 }]}>姓名</Text>
        <Text style={[styles.th, { flex: 2 }]}>拜访</Text>
        <Text style={[styles.th, { flex: 2 }]}>成交</Text>
        <Text style={[styles.th, { flex: 2 }]}>率</Text>
      </View>
      {teamRanking.map((t, i) => (
        <View key={t.name} style={[styles.tableRow, i === 0 && styles.tableRowFirst]}>
          <Text style={[styles.td, { flex: 3, fontWeight: i === 0 ? '700' : '400' }]}>{i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : '🥉 '}{t.name}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{t.visits}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{t.deals}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{t.rate}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: { width: '47%', backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center' },
  kpiValue: { fontSize: 24, fontWeight: '700' },
  kpiLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  kpiChange: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  tableHeader: { flexDirection: 'row', padding: 10, backgroundColor: '#f9fafb', borderRadius: 8 },
  th: { fontSize: 12, color: '#888', fontWeight: '600' },
  tableRow: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableRowFirst: { backgroundColor: '#fffbeb' },
  td: { fontSize: 13, color: '#333' },
});
