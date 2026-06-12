import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView,
} from 'react-native';

const COLORS = {
  primary: '#165DFF',
  danger: '#F53F3F',
  text: '#1D2129',
  bg: '#FFFFFF',
  placeholder: '#C9CDD4',
  divider: '#E5E6EB',
  cardBg: '#F7F8FA',
  warning: '#FF7D00',
};

const VISIT_TYPES = ['例行拜訪', '新客開發', '產品展示', '學術支援', '回款跟進', '客訴處理'];
const PURPOSES = ['維繫關係', '推廣新品', '簽約', '收款', '處理退換貨', '其他'];

export default function ScheduleScreen() {
  const [customerSearch, setCustomerSearch] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [visitType, setVisitType] = useState('例行拜訪');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showPurposePicker, setShowPurposePicker] = useState(false);

  const handleSubmit = () => {
    if (!customer) { Alert.alert('提示', '請選擇客戶'); return; }
    if (!visitDate.trim()) { Alert.alert('提示', '請選擇日期'); return; }
    if (!visitTime.trim()) { Alert.alert('提示', '請選擇時間'); return; }

    // 模擬營業時間檢查
    if (customer?.businessHours) {
      const [start, end] = customer.businessHours.split('~');
      if (visitTime < start || visitTime > end) {
        Alert.alert(
          '營業時間提示',
          `該客戶營業時間為 ${customer.businessHours}，請確認是否仍要預排？`,
          [{ text: '取消', style: 'cancel' }, { text: '仍要預排', onPress: () => submitSchedule() }]
        );
        return;
      }
    }
    submitSchedule();
  };

  const submitSchedule = () => {
    // TODO: call visitApi.create
    Alert.alert('成功', `已預排 ${visitDate} ${visitTime} 拜訪 ${customer?.name || ''}`);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>行程預排</Text>

      {/* 搜尋客戶 */}
      <Text style={styles.label}>客戶</Text>
      <TextInput
        style={styles.input}
        placeholder="搜尋客戶名稱 / 編號 / 統編"
        placeholderTextColor={COLORS.placeholder}
        value={customerSearch}
        onChangeText={setCustomerSearch}
      />
      {customer && (
        <View style={styles.selectedCustomer}>
          <Text style={styles.custName}>{customer.name}</Text>
          <Text style={styles.custInfo}>
            {customer.address}{customer.businessHours ? ` | 營業 ${customer.businessHours}` : ''}
          </Text>
        </View>
      )}

      {/* 拜訪類型 */}
      <Text style={styles.label}>拜訪類型</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => setShowTypePicker(!showTypePicker)}>
        <Text style={styles.selectText}>{visitType || '請選擇拜訪類型'}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {showTypePicker && (
        <View style={styles.pickerDropdown}>
          {VISIT_TYPES.map((t) => (
            <TouchableOpacity key={t} style={[styles.pickerItem, visitType === t && styles.pickerItemActive]}
              onPress={() => { setVisitType(t); setShowTypePicker(false); }}>
              <Text style={[styles.pickerItemText, visitType === t && styles.pickerItemTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 日期 */}
      <Text style={styles.label}>預排日期</Text>
      <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.placeholder}
        value={visitDate} onChangeText={setVisitDate} keyboardType="numbers-and-punctuation" />

      {/* 時間 */}
      <Text style={styles.label}>預排時間</Text>
      <TextInput style={styles.input} placeholder="HH:MM" placeholderTextColor={COLORS.placeholder}
        value={visitTime} onChangeText={setVisitTime} keyboardType="numbers-and-punctuation" />

      {/* 拜訪目的 */}
      <Text style={styles.label}>拜訪目的</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => setShowPurposePicker(!showPurposePicker)}>
        <Text style={styles.selectText}>{purpose || '請選擇拜訪目的'}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {showPurposePicker && (
        <View style={styles.pickerDropdown}>
          {PURPOSES.map((p) => (
            <TouchableOpacity key={p} style={[styles.pickerItem, purpose === p && styles.pickerItemActive]}
              onPress={() => { setPurpose(p); setShowPurposePicker(false); }}>
              <Text style={[styles.pickerItemText, purpose === p && styles.pickerItemTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 提交 */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
        <Text style={styles.submitText}>確認預排</Text>
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
  selectedCustomer: {
    backgroundColor: COLORS.cardBg, borderRadius: 8, padding: 12, marginTop: 8,
  },
  custName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  custInfo: { fontSize: 13, color: '#86909C', marginTop: 4 },
  selectBtn: {
    height: 44, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 4, paddingVertical: 8,
  },
  selectText: { fontSize: 16, color: COLORS.text },
  arrow: { fontSize: 12, color: COLORS.placeholder },
  pickerDropdown: {
    backgroundColor: COLORS.cardBg, borderRadius: 8, marginTop: 6,
    paddingVertical: 4, paddingHorizontal: 8,
  },
  pickerItem: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 6 },
  pickerItemActive: { backgroundColor: '#E8F3FF' },
  pickerItemText: { fontSize: 15, color: COLORS.text },
  pickerItemTextActive: { color: COLORS.primary, fontWeight: '600' },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8, height: 48,
    justifyContent: 'center', alignItems: 'center', marginTop: 36, marginBottom: 40,
  },
  submitText: { color: COLORS.bg, fontSize: 17, fontWeight: '600' },
});