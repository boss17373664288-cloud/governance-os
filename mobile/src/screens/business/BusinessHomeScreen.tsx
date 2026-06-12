import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const COLORS = {
  primary: '#165DFF',
  danger: '#F53F3F',
  text: '#1D2129',
  bg: '#FFFFFF',
  cardBg: '#F7F8FA',
  muted: '#86909C',
};

const QUICK_ACTIONS = [
  { icon: '📋', label: '新增訂單', route: 'NewOrder' },
  { icon: '📝', label: '新增拜訪', route: 'VisitRecord' },
  { icon: '📷', label: 'OCR 拍照', route: 'OCR' },
  { icon: '📌', label: '任務中心', route: 'TaskCenter' },
];

export default function BusinessHomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* 頂部問候 */}
      <View style={styles.headerArea}>
        <Text style={styles.greeting}>業務工作台</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('zh-TW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      {/* 四宮格 */}
      <View style={styles.grid}>
        {QUICK_ACTIONS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.gridItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.route)}
          >
            <Text style={styles.gridIcon}>{item.icon}</Text>
            <Text style={styles.gridLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerArea: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: COLORS.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  gridIcon: {
    fontSize: 36,
  },
  gridLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});