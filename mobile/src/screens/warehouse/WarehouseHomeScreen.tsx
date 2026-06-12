import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const actions = [
  { icon: '📥', label: '收货', color: '#3b82f6' },
  { icon: '📤', label: '出货', color: '#22c55e' },
  { icon: '📦', label: '上架', color: '#8b5cf6' },
  { icon: '🔍', label: '拣货', color: '#f59e0b' },
  { icon: '📋', label: '盘点', color: '#06b6d4' },
  { icon: '⚠️', label: 'Recall隔离', color: '#ef4444' },
  { icon: '❌', label: '不良品', color: '#dc2626' },
  { icon: '🔄', label: '调拨', color: '#6366f1' },
  { icon: '📷', label: '扫描条码', color: '#14b8a6' },
  { icon: '🌡️', label: '温控记录', color: '#f97316' },
];

export default function WarehouseHomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PDA 仓储控制台</Text>
        <Text style={styles.subtitle}>高效仓储治理终端</Text>
      </View>
      <View style={styles.grid}>
        {actions.map(a => (
          <TouchableOpacity key={a.label} style={styles.card}>
            <Text style={styles.cardIcon}>{a.icon}</Text>
            <Text style={styles.cardLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.scanArea}>
        <Text style={styles.scanTitle}>快速扫描</Text>
        <TouchableOpacity style={styles.scanBtn}>
          <Text style={styles.scanIcon}>📷</Text>
          <Text style={styles.scanText}>扫描条码 / QR / UDI / 批号</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>网络: 在线</Text>
        <Text style={styles.statusText}>离线队列: 0 笔待同步</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  card: { width: '30%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, alignItems: 'center' },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardLabel: { fontSize: 13, color: '#e2e8f0', fontWeight: '500' },
  scanArea: { margin: 16, padding: 20, backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  scanTitle: { fontSize: 15, fontWeight: '600', color: '#60a5fa', marginBottom: 12 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scanIcon: { fontSize: 28 },
  scanText: { fontSize: 14, color: '#93c5fd' },
  statusBar: { margin: 16, padding: 14, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between' },
  statusText: { fontSize: 12, color: '#94a3b8' },
});