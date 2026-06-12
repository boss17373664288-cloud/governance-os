import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function RiskSummaryScreen({ navigation }: any) {
  const risks = {
    highCustomers: [{ name: '台大医院', reason: '逾期45天, ¥125,000' }],
    expiring: [{ name: '玻尿酸 100ml', batch: 'BT-PROD-013-01', days: 30 }],
    lowStock: [{ name: 'N95口罩', qty: 50 }, { name: '注射针头 #11', qty: 120 }],
    activeRecalls: [{ no: 'RC4000001', level: 'R4', status: '执行中' }],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 风险摘要</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔴 高风险客户</Text>
        {risks.highCustomers.map((c, i) => (
          <View key={i} style={styles.riskItem}><Text style={styles.riskName}>{c.name}</Text><Text style={styles.riskDetail}>{c.reason}</Text></View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🟡 即将过期产品</Text>
        {risks.expiring.map((e, i) => (
          <View key={i} style={styles.riskItem}><Text style={styles.riskName}>{e.name} ({e.batch})</Text><Text style={styles.riskDetail}>{e.days}天后到期</Text></View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🟠 低库存预警</Text>
        {risks.lowStock.map((s, i) => (
          <View key={i} style={styles.riskItem}><Text style={styles.riskName}>{s.name}</Text><Text style={styles.riskDetail}>库存: {s.qty}</Text></View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚨 进行中召回</Text>
        {risks.activeRecalls.map((r, i) => (
          <View key={i} style={styles.riskItem}><Text style={styles.riskName}>{r.no} [{r.level}]</Text><Text style={styles.riskDetail}>{r.status}</Text></View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  riskItem: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' },
  riskName: { fontSize: 13, fontWeight: '600', color: '#333' },
  riskDetail: { fontSize: 12, color: '#888' },
});
