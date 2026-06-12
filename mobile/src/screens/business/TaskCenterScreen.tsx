import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

const COLORS = {
  primary: '#165DFF',
  text: '#1D2129',
  bg: '#FFFFFF',
  placeholder: '#C9CDD4',
  divider: '#E5E6EB',
  cardBg: '#F7F8FA',
  muted: '#86909C',
};

const MOCK_TASKS = [
  { id: '1', title: '審批待處理 - 訂單 #SO-001', time: '10 分鐘前', status: 'pending' },
  { id: '2', title: '拜訪提醒 - 忠孝美麗醫療診所', time: '30 分鐘前', status: 'upcoming' },
  { id: '3', title: '樣品申請需跟進', time: '2 小時前', status: 'pending' },
  { id: '4', title: '回款提醒 - 台大醫院', time: '昨天', status: 'overdue' },
];

export default function TaskCenterScreen() {
  const [loading, setLoading] = useState(true);

  // 模擬載入
  useState(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#FFF7E6', color: '#FF7D00', label: '待處理' };
      case 'upcoming': return { bg: '#E8F3FF', color: COLORS.primary, label: '即將到來' };
      case 'overdue': return { bg: '#FFECE8', color: '#F53F3F', label: '已逾期' };
      default: return { bg: COLORS.cardBg, color: COLORS.muted, label: status };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>任務中心</Text>
      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>載入中，請稍候...</Text>
        </View>
      ) : (
        <ScrollView>
          {MOCK_TASKS.map((task) => {
            const s = getStatusStyle(task.status);
            return (
              <TouchableOpacity key={task.id} style={styles.card} activeOpacity={0.7}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardTitle}>{task.title}</Text>
                  <View style={[styles.badge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>
                <Text style={styles.cardTime}>{task.time}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20, paddingTop: 60 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, color: COLORS.placeholder },
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: 10, padding: 16, marginBottom: 10,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '500', color: COLORS.text, flex: 1, marginRight: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cardTime: { fontSize: 12, color: COLORS.muted },
});