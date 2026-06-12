import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator,
} from 'react-native';

const COLORS = {
  primary: '#165DFF',
  text: '#1D2129',
  bg: '#FFFFFF',
  placeholder: '#C9CDD4',
  divider: '#E5E6EB',
  cardBg: '#F7F8FA',
};

export default function ConsignmentOutScreen() {
  const [customerSearch, setCustomerSearch] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!customer) { Alert.alert('提示', '請選擇客戶'); return; }
    if (!product.trim()) { Alert.alert('提示', '請輸入產品'); return; }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) { Alert.alert('提示', '數量必須大於 0'); return; }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('成功', '寄庫出庫申請已提交');
    }, 1000);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>寄庫出庫</Text>

      <Text style={styles.label}>客戶</Text>
      <TextInput style={styles.input} placeholder="搜尋客戶名稱 / 編號"
        placeholderTextColor={COLORS.placeholder} value={customerSearch} onChangeText={setCustomerSearch} />
      {customer && (
        <View style={styles.selectedCustomer}>
          <Text style={styles.custName}>{customer.name}</Text>
        </View>
      )}

      <Text style={styles.label}>產品</Text>
      <TextInput style={styles.input} placeholder="請輸入產品名稱" placeholderTextColor={COLORS.placeholder}
        value={product} onChangeText={setProduct} editable={!loading} />

      <Text style={styles.label}>本次出庫數量</Text>
      <TextInput style={styles.input} placeholder="請輸入數量" placeholderTextColor={COLORS.placeholder}
        value={quantity} onChangeText={setQuantity} keyboardType="numeric" editable={!loading} />

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit} disabled={loading} activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.bg} />
        ) : (
          <Text style={styles.submitText}>提交申請</Text>
        )}
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
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8, height: 48,
    justifyContent: 'center', alignItems: 'center', marginTop: 36, marginBottom: 40,
  },
  submitBtnDisabled: { backgroundColor: COLORS.placeholder },
  submitText: { color: COLORS.bg, fontSize: 17, fontWeight: '600' },
});