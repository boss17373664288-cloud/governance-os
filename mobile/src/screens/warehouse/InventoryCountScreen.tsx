import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';

export default function InventoryCountScreen({ navigation }: any) {
  const [items] = useState([
    { id: '1', location: 'A-03-12', product: '玻尿酸 100ml', batchNo: 'BT-PROD-013-01', systemQty: 100, actualQty: '' },
    { id: '2', location: 'B-01-05', product: '注射针头 #11', batchNo: 'BT-PROD-012-01', systemQty: 500, actualQty: '' },
  ]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📋 盘点</Text>
      <TouchableOpacity style={styles.createBtn}><Text style={styles.createBtnText}>+ 建立盘点任务</Text></TouchableOpacity>
      <Text style={styles.sectionTitle}>盘点明细</Text>
      {items.map(item => (
        <View key={item.id} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemLocation}>📍 {item.location}</Text>
            <Text style={styles.itemName}>{item.product}</Text>
          </View>
          <Text style={styles.itemBatch}>批号: {item.batchNo}</Text>
          <View style={styles.countRow}>
            <Text style={styles.systemQty}>系统: {item.systemQty}</Text>
            <TextInput style={styles.actualInput} keyboardType='numeric' placeholder='实际数量' />
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.submitBtn}><Text style={styles.submitBtnText}>提交盘点结果</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  createBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  itemCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemLocation: { fontSize: 12, color: '#888' },
  itemName: { fontSize: 13, fontWeight: '600', color: '#333' },
  itemBatch: { fontSize: 11, color: '#aaa', marginBottom: 8 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  systemQty: { fontSize: 13, color: '#666' },
  actualInput: { width: 100, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, padding: 6, fontSize: 14, textAlign: 'center' },
  submitBtn: { backgroundColor: '#16a34a', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
