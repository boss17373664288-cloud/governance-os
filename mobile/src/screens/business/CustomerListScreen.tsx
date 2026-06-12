import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { customerApi } from '../../services/api';

const COLORS = {
  primary: '#165DFF',
  text: '#1D2129',
  bg: '#FFFFFF',
  placeholder: '#C9CDD4',
  divider: '#E5E6EB',
  cardBg: '#F7F8FA',
  muted: '#86909C',
};

export default function CustomerListScreen() {
  const [search, setSearch] = useState('');
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async (keyword = '') => {
    setLoading(true);
    try {
      const res: any = await customerApi.list({ keyword, pageSize: 50 });
      setList(res.data?.items || res.data || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearch = () => fetchCustomers(search);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <Text style={styles.custName}>{item.name || item.customer_name || '--'}</Text>
      <Text style={styles.custCode}>{item.code || item.customer_code || ''}</Text>
      <View style={styles.row}>
        <Text style={styles.tag}>{item.status || item.customer_status || '--'}</Text>
        <Text style={styles.muted}>{item.region || item.region_code || ''}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>客戶列表</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜尋客戶名稱 / 編號"
          placeholderTextColor={COLORS.placeholder}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>搜尋</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, i) => item.id || item.customer_id || String(i)}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>暫無客戶資料</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20, paddingTop: 60 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchInput: {
    flex: 1, height: 42, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
    fontSize: 15, color: COLORS.text, paddingHorizontal: 4,
  },
  searchBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  searchBtnText: { color: COLORS.bg, fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: 10, padding: 16, marginBottom: 10,
  },
  custName: { fontSize: 17, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  custCode: { fontSize: 13, color: COLORS.muted, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: {
    fontSize: 12, color: COLORS.primary, backgroundColor: '#E8F3FF',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4, overflow: 'hidden',
  },
  muted: { fontSize: 12, color: COLORS.muted },
  empty: { textAlign: 'center', color: COLORS.muted, fontSize: 15, marginTop: 60 },
});