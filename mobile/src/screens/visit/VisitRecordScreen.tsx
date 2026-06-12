import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform, PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { api } from '../../services/api';

const COLORS = {
  primary: '#165DFF',
  danger: '#F53F3F',
  text: '#1D2129',
  bg: '#FFFFFF',
  placeholder: '#C9CDD4',
  divider: '#E5E6EB',
  cardBg: '#F7F8FA',
  success: '#00B42A',
};

const RESULTS = ['客戶有興趣', '無興趣', '需追蹤', '準備下單', '需樣品', '需報價', '有價格問題', '需學術支援'];
const NEXT_STEPS = ['寄送樣品', '提供報價', '安排展示', '約定下次拜訪', '提交審批', '其他'];
const VISIT_TYPES = ['例行拜訪', '新客開發', '產品展示', '問題處理', '收款拜訪'];

export default function VisitRecordScreen() {
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [visitType, setVisitType] = useState('例行拜訪');
  const [result, setResult] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [note, setNote] = useState('');
  const [showResultPicker, setShowResultPicker] = useState(false);
  const [showNextPicker, setShowNextPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setGpsLoading(true);
    setGpsError('');
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          { title: '位置權限', message: '需要取得您的GPS位置以記錄拜訪打卡', buttonPositive: '允許' }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setGpsError('GPS權限被拒絕');
          setGpsLoading(false);
          return;
        }
      }
      Geolocation.getCurrentPosition(
        (position) => {
          setGps({ lat: position.coords.latitude, lng: position.coords.longitude });
          setGpsLoading(false);
        },
        (error) => {
          setGpsError('無法取得GPS: ' + error.message);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    } catch (e: any) {
      setGpsError('GPS錯誤: ' + (e.message || '未知'));
      setGpsLoading(false);
    }
  };

  useEffect(() => {
    if (customerSearch.length < 1) { setCustomers([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res: any = await api.get('/customers', { params: { search: customerSearch, page_size: 10 } });
        setCustomers(res?.data || res || []);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleSubmit = async () => {
    if (!customerId) { Alert.alert('提示', '請選擇客戶'); return; }
    if (!result) { Alert.alert('提示', '請選擇本次結果'); return; }
    if (!gps) { Alert.alert('提示', '等待GPS定位完成'); return; }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const payload: any = {
        customer_id: customerId,
        visit_date: today,
        visit_type: visitType,
        visit_purpose: visitType,
        result_code: result,
        notes: note || '',
      };
      if (nextStep) payload.next_action = nextStep;
      if (nextDate) payload.next_followup_date = nextDate;

      payload.gps_latitude = gps.lat;
      payload.gps_longitude = gps.lng;
      await api.post('/visits/records', payload);

      Alert.alert('成功', '拜訪記錄已儲存\nGPS: ' + gps.lat.toFixed(6) + ', ' + gps.lng.toFixed(6), [
        { text: '確定', onPress: () => resetForm() }
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '儲存失敗';
      Alert.alert('錯誤', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setResult('');
    setNextStep('');
    setNextDate('');
    setNote('');
    setCustomerId('');
    setCustomerName('');
    setCustomerSearch('');
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>新增拜訪</Text>

      <View style={styles.gpsBar}>
        {gpsLoading ? (
          <View style={styles.gpsRow}><ActivityIndicator size="small" color={COLORS.primary} /><Text style={styles.gpsText}>定位中...</Text></View>
        ) : gps ? (
          <View style={styles.gpsRow}>
            <Text style={styles.gpsIcon}>📍</Text>
            <Text style={styles.gpsText}>{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</Text>
            <TouchableOpacity onPress={requestLocation}><Text style={styles.gpsRefresh}>⟳</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gpsRow}>
            <Text style={styles.gpsErrorIcon}>⚠️</Text>
            <Text style={styles.gpsErrorText}>{gpsError || '無法定位'}</Text>
            <TouchableOpacity onPress={requestLocation}><Text style={styles.gpsRefresh}>重試</Text></TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.label}>客戶</Text>
      {customerId ? (
        <View style={styles.selectedCustomer}>
          <Text style={styles.selectedCustomerText}>{customerName}</Text>
          <TouchableOpacity onPress={() => { setCustomerId(''); setCustomerName(''); setCustomerSearch(''); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TextInput style={styles.input} placeholder="輸入客戶名稱搜尋..." placeholderTextColor={COLORS.placeholder}
            value={customerSearch} onChangeText={setCustomerSearch}
            onFocus={() => setShowCustomerPicker(true)} />
          {showCustomerPicker && customers.length > 0 && (
            <View style={styles.dropdown}>
              {customers.map((c: any) => (
                <TouchableOpacity key={c.customer_id} style={styles.dropItem}
                  onPress={() => {
                    setCustomerId(c.customer_id);
                    setCustomerName(c.customer_name);
                    setCustomerSearch('');
                    setShowCustomerPicker(false);
                  }}>
                  <Text style={styles.dropItemText}>{c.customer_name}</Text>
                  <Text style={styles.dropItemSub}>{c.customer_code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      <Text style={styles.label}>拜訪類型</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => setShowTypePicker(!showTypePicker)}>
        <Text style={styles.selectText}>{visitType}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {showTypePicker && (
        <View style={styles.dropdown}>
          {VISIT_TYPES.map((t) => (
            <TouchableOpacity key={t} style={[styles.dropItem, visitType === t && styles.dropItemActive]}
              onPress={() => { setVisitType(t); setShowTypePicker(false); }}>
              <Text style={[styles.dropItemText, visitType === t && styles.dropItemTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>本次結果</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => setShowResultPicker(!showResultPicker)}>
        <Text style={[styles.selectText, !result && { color: COLORS.placeholder }]}>
          {result || '請選擇本次拜訪結果'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {showResultPicker && (
        <View style={styles.dropdown}>
          {RESULTS.map((r: string) => (
            <TouchableOpacity key={r} style={[styles.dropItem, result === r && styles.dropItemActive]}
              onPress={() => { setResult(r); setShowResultPicker(false); }}>
              <Text style={[styles.dropItemText, result === r && styles.dropItemTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>下一步動作</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => setShowNextPicker(!showNextPicker)}>
        <Text style={[styles.selectText, !nextStep && { color: COLORS.placeholder }]}>
          {nextStep || '請選擇下一步動作'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {showNextPicker && (
        <View style={styles.dropdown}>
          {NEXT_STEPS.map((s: string) => (
            <TouchableOpacity key={s} style={[styles.dropItem, nextStep === s && styles.dropItemActive]}
              onPress={() => { setNextStep(s); setShowNextPicker(false); }}>
              <Text style={[styles.dropItemText, nextStep === s && styles.dropItemTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>下次追蹤日期</Text>
      <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.placeholder}
        value={nextDate} onChangeText={setNextDate} keyboardType="numbers-and-punctuation" />

      <Text style={styles.label}>備註</Text>
      <TextInput style={[styles.input, styles.notesInput]} placeholder="簡短備註（可選）"
        placeholderTextColor={COLORS.placeholder} value={note} onChangeText={setNote}
        multiline numberOfLines={3} textAlignVertical="top" />

      <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit} activeOpacity={0.8} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={COLORS.bg} />
        ) : (
          <Text style={styles.submitText}>儲存記錄</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20, paddingTop: 60 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  gpsBar: {
    backgroundColor: COLORS.cardBg, borderRadius: 8, padding: 12, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center',
  },
  gpsRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  gpsIcon: { fontSize: 16, marginRight: 8 },
  gpsText: { fontSize: 13, color: COLORS.success, flex: 1 },
  gpsErrorIcon: { fontSize: 16, marginRight: 8 },
  gpsErrorText: { fontSize: 13, color: COLORS.danger, flex: 1 },
  gpsRefresh: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginLeft: 8, padding: 4 },
  selectedCustomer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, borderBottomWidth: 1, borderBottomColor: COLORS.divider, paddingHorizontal: 4 },
  selectedCustomerText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  clearBtn: { fontSize: 18, color: COLORS.placeholder, padding: 4 },
  dropItemSub: { fontSize: 12, color: COLORS.placeholder, marginTop: 2 },
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
  submitBtnDisabled: { backgroundColor: '#94BFFF' },
  submitText: { color: COLORS.bg, fontSize: 17, fontWeight: '600' },
});
