import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { orderApi } from '../../services/api';

const COLORS = {
  primary: '#165DFF',
  text: '#1D2129',
  bg: '#FFFFFF',
  placeholder: '#C9CDD4',
  divider: '#E5E6EB',
};

export default function NewOrderScreen({ navigation }: any) {
  const [customer, setCustomer] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('0');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!customer.trim()) { Alert.alert('提示', '請輸入客戶'); return; }
    if (!product.trim()) { Alert.alert('提示', '請輸入產品'); return; }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) { Alert.alert('提示', '數量必須大於 0'); return; }

    setLoading(true);
    try {
      await orderApi.create({
        customer_name: customer.trim(),
        product_name: product.trim(),
        quantity: qty,
        unit_price: parseFloat(price) || 0,
      });
      Alert.alert('成功', '訂單已建立', [
        { text: '確定', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('失敗', e.response?.data?.message || '建立訂單失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>新增銷售訂單</Text>

      <Text style={styles.label}>客戶</Text>
      <TextInput style={styles.input} placeholder="請輸入客戶名稱" placeholderTextColor={COLORS.placeholder}
        value={customer} onChangeText={setCustomer} editable={!loading} />

      <Text style={styles.label}>產品</Text>
      <TextInput style={styles.input} placeholder="請輸入產品名稱" placeholderTextColor={COLORS.placeholder}
        value={product} onChangeText={setProduct} editable={!loading} />

      <Text style={styles.label}>數量</Text>
      <TextInput style={styles.input} placeholder="請輸入數量" placeholderTextColor={COLORS.placeholder}
        value={quantity} onChangeText={setQuantity} keyboardType="numeric" editable={!loading} />

      <Text style={styles.label}>單價 (NT$)</Text>
      <TextInput style={styles.input} placeholder="請輸入單價" placeholderTextColor={COLORS.placeholder}
        value={price} onChangeText={setPrice} keyboardType="numeric" editable={!loading} />

      <Text style={styles.subtotal}>
        小計：NT$ {((parseFloat(price) || 0) * (parseInt(quantity, 10) || 0)).toLocaleString()}
      </Text>

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit} disabled={loading} activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.bg} />
        ) : (
          <Text style={styles.submitText}>建立訂單</Text>
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
  subtotal: { fontSize: 18, fontWeight: '600', color: COLORS.primary, marginTop: 20, textAlign: 'right' },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8, height: 48,
    justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 40,
  },
  submitBtnDisabled: { backgroundColor: COLORS.placeholder },
  submitText: { color: COLORS.bg, fontSize: 17, fontWeight: '600' },
});