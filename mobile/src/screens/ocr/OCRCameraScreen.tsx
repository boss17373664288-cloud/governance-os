import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';

export default function OCRCameraScreen() {
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'business_card' | 'order'>('business_card');

  const handleCapture = () => {
    // In production: open camera, send to PaddleOCR
    const mock = mode === 'business_card'
      ? { contact_name: '王大明', position: '主任医师', company: '台大医院', phone: '02-23123456', mobile: '0912-345-678' }
      : { customer_name: 'XX诊所', product_name: '玻尿酸注射剂', quantity: 10, total_amount: 35000 };
    setResult(mock);
    Alert.alert('OCR 完成', '识别结果已生成，请确认');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>OCR 智能辨识</Text>
      <View style={styles.modeTabs}>
        {['business_card','order'].map(m => (
          <TouchableOpacity key={m} style={[styles.modeTab, mode===m && styles.modeTabActive]} onPress={() => { setMode(m as any); setResult(null); }}>
            <Text style={[styles.modeText, mode===m && styles.modeTextActive]}>{m==='business_card'?'名片辨识':'订单辨识'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
        <Text style={styles.captureIcon}>📸</Text>
        <Text style={styles.captureText}>点击拍照</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>辨识结果</Text>
          {Object.entries(result).map(([k, v]) => (
            <View key={k} style={styles.resultRow}>
              <Text style={styles.resultKey}>{k}</Text>
              <Text style={styles.resultVal}>{String(v)}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.confirmBtn}>
            <Text style={styles.confirmText}>确认并建立草稿</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  modeTabs: { flexDirection: 'row', marginBottom: 20, borderRadius: 10, overflow: 'hidden' },
  modeTab: { flex: 1, padding: 12, backgroundColor: '#fff', alignItems: 'center' },
  modeTabActive: { backgroundColor: '#3b82f6' },
  modeText: { fontSize: 14, color: '#374151' },
  modeTextActive: { color: '#fff', fontWeight: '600' },
  captureBtn: { backgroundColor: '#fff', borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed' },
  captureIcon: { fontSize: 48, marginBottom: 12 },
  captureText: { fontSize: 16, color: '#6b7280' },
  resultCard: { marginTop: 20, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  resultTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  resultKey: { fontSize: 13, color: '#6b7280' },
  resultVal: { fontSize: 13, fontWeight: '500', color: '#111827' },
  confirmBtn: { marginTop: 16, backgroundColor: '#22c55e', borderRadius: 8, padding: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});