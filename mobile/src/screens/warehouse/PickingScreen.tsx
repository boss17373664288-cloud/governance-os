import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function PickingScreen({ navigation }: any) {
  const [taskNo, setTaskNo] = useState('');
  const items = [
    { id: '1', product: '玻尿酸 100ml', batchNo: 'BT-PROD-013-01', location: 'A-03-12', qty: 5, picked: 0 },
    { id: '2', product: '注射针头 #11', batchNo: 'BT-PROD-012-01', location: 'B-01-05', qty: 50, picked: 0 },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📦 拣货</Text>
      <View style={styles.scanSection}>
        <TextInput style={styles.scanInput} placeholder='扫描出库任务单号...' value={taskNo} onChangeText={setTaskNo} />
        <TouchableOpacity style={styles.scanBtn}><Text style={styles.scanBtnText}>扫描</Text></TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>FEFO 推荐拣货</Text>
      {items.map(item => (
        <View key={item.id} style={styles.itemCard}>
          <Text style={styles.itemName}>{item.product}</Text>
          <View style={styles.itemDetail}>
            <Text style={styles.itemInfo}>批号: {item.batchNo}</Text>
            <Text style={styles.itemInfo}>储位: {item.location}</Text>
          </View>
          <View style={styles.pickRow}>
            <Text style={styles.pickQty}>需拣: {item.qty} | 已拣: {item.picked}</Text>
            <TouchableOpacity style={styles.pickBtn}>
              <Text style={styles.pickBtnText}>确认拣货</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  scanSection: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  scanInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#fff' },
  scanBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
  scanBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  itemCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  itemDetail: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  itemInfo: { fontSize: 12, color: '#888' },
  pickRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickQty: { fontSize: 13, color: '#333', fontWeight: '500' },
  pickBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  pickBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
