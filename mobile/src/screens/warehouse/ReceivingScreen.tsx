import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';

export default function ReceivingScreen({ navigation }: any) {
  const [scanText, setScanText] = useState('');
  const [items] = useState([
    { id: '1', product: '玻尿酸 100ml', batchNo: 'BT-PROD-013-01', expected: 100, received: 0, unit: '盒' },
    { id: '2', product: 'N95口罩', batchNo: 'BT-PROD-004-02', expected: 500, received: 0, unit: '个' },
  ]);

  const handleScan = () => {
    Alert.alert('扫描', '扫描到: ' + (scanText || '(请输入单号)'));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📥 收货</Text>
      <View style={styles.scanSection}>
        <TextInput style={styles.scanInput} placeholder='扫描采购单号或供应商送货单...' value={scanText} onChangeText={setScanText} />
        <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
          <Text style={styles.scanBtnText}>扫描</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>待收货明细</Text>
      {items.map(item => (
        <View key={item.id} style={styles.itemCard}>
          <Text style={styles.itemName}>{item.product}</Text>
          <Text style={styles.itemBatch}>批号: {item.batchNo}</Text>
          <View style={styles.itemRow}>
            <Text style={styles.itemQty}>应收: {item.expected} {item.unit}</Text>
            <Text style={styles.itemReceived}>已收: {item.received} {item.unit}</Text>
          </View>
          <View style={styles.receiveRow}>
            <TextInput style={styles.qtyInput} keyboardType='numeric' placeholder='数量' />
            <TouchableOpacity style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>确认收货</Text>
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
  itemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemBatch: { fontSize: 12, color: '#888', marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemQty: { fontSize: 13, color: '#666' },
  itemReceived: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  receiveRow: { flexDirection: 'row', gap: 8 },
  qtyInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, fontSize: 14 },
  confirmBtn: { backgroundColor: '#16a34a', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
