import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView,
} from 'react-native';

const COLORS = {
  primary: '#165DFF',
  text: '#1D2129',
  bg: '#FFFFFF',
  placeholder: '#C9CDD4',
  divider: '#E5E6EB',
  cardBg: '#F7F8FA',
};

const RESULTS = ['客戶有興趣', '無興趣', '需追蹤', '準備下單', '需樣品', '需報價', '有價格問題', '需學術支援'];
const NEXT_STEPS = ['寄送樣品', '提供報價', '安排展示', '約定下次拜訪', '提交審批', '其他'];

export default function VisitRecordScreen() {
  const [result, setResult] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [note, setNote] = useState('');
  const [showResultPicker, setShowResultPicker] = useState(false);
  const [showNextPicker, setShowNextPicker] = useState(false);

  const handleSubmit = () => {
    if (!result) { Alert.alert('提示', '請選擇本次結果'); return; }
    Alert.alert('成功', '拜訪記錄已儲存');
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>拜訪記錄</Text>

      {/* 本次結果 */}
      <Text style={styles.label}>本次結果</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => setShowResultPicker(!showResultPicker)}>
        <Text style={[styles.selectText, !result && { color: COLORS.placeholder }]}>
          {result || '請選擇本次拜訪結果'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {showResultPicker && (
        <View style={styles.dropdown}>
          {RESULTS.map((r) => (
            <TouchableOpacity key={r} style={[styles.dropItem, result === r && styles.dropItemActive]}
              onPress={() => { setResult(r); setShowResultPicker(false); }}>
              <Text style={[styles.dropItemText, result === r && styles.dropItemTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 下一步 */}
      <Text style={styles.label}>下一步動作</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => setShowNextPicker(!showNextPicker)}>
        <Text style={[styles.selectText, !nextStep && { color: COLORS.placeholder }]}>
          {nextStep || '請選擇下一步動作'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {showNextPicker && (
        <View style={styles.dropdown}>
          {NEXT_STEPS.map((s) => (
            <TouchableOpacity key={s} style={[styles.dropItem, nextStep === s && styles.dropItemActive]}
              onPress={() => { setNextStep(s); setShowNextPicker(false); }}>
              <Text style={[styles.dropItemText, nextStep === s && styles.dropItemTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 下次追蹤日 */}
      <Text style={styles.label}>下次追蹤日期</Text>
      <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.placeholder}
        value={nextDate} onChangeText={setNextDate} keyboardType="numbers-and-punctuation" />

      {/* 備註 */}
      <Text style={styles.label}>備註</Text>
      <TextInput style={[styles.input, styles.notesInput]} placeholder="簡短備註（可選）"
        placeholderTextColor={COLORS.placeholder} value={note} onChangeText={setNote}
        multiline numberOfLines={3} textAlignVertical="top" />

      {/* 提交 */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
        <Text style={styles.submitText}>儲存記錄</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20, paddingTop: 60 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  input: {
    height: 44, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
    fontSize: 16, color: COLORS.text, paddingHorizontal: 4, paddingVertical: 8,
  },
  notesInput: { height: 80, paddingTop: 12 },
  selectBtn: {
    height: 44, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 4, paddingVertical: 8,
  },
  selectText: { fontSize: 16, color: COLORS.text },
  arrow: { fontSize: 12, color: COLORS.placeholder },
  dropdown: {
    backgroundColor: COLORS.cardBg, borderRadius: 8, marginTop: 6,
    paddingVertical: 4, paddingHorizontal: 8,
  },
  dropItem: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 6 },
  dropItemActive: { backgroundColor: '#E8F3FF' },
  dropItemText: { fontSize: 15, color: COLORS.text },
  dropItemTextActive: { color: COLORS.primary, fontWeight: '600' },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8, height: 48,
    justifyContent: 'center', alignItems: 'center', marginTop: 36, marginBottom: 40,
  },
  submitText: { color: COLORS.bg, fontSize: 17, fontWeight: '600' },
});