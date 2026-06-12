import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function TeamMapScreen({ navigation }: any) {
  const [team] = useState([
    { id: '1', name: '张业务', status: '拜访中', location: '台大医院', gps: { lat: 25.033, lng: 121.565 }, lastUpdate: '2分钟前' },
    { id: '2', name: '李业务', status: '移动中', location: '台北市信义区', gps: { lat: 25.040, lng: 121.566 }, lastUpdate: '30秒前' },
    { id: '3', name: '王业务', status: '已签退', location: '-', gps: null, lastUpdate: '1小时前' },
  ]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🗺️ 团队行程监控</Text>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>地图组件 - 显示团队GPS位置</Text>
        <Text style={styles.mapSubText}>需集成高德/百度地图SDK</Text>
      </View>
      <Text style={styles.sectionTitle}>团队成员 ({team.length}人)</Text>
      {team.map(m => (
        <View key={m.id} style={styles.memberCard}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberName}>👤 {m.name}</Text>
            <Text style={[styles.memberStatus, { color: m.status === '拜访中' ? '#16a34a' : m.status === '移动中' ? '#f59e0b' : '#9ca3af' }]}>
              {m.status}
            </Text>
          </View>
          <Text style={styles.memberLocation}>📍 {m.location}</Text>
          <Text style={styles.memberUpdate}>更新: {m.lastUpdate}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  mapPlaceholder: { height: 200, backgroundColor: '#e5e7eb', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  mapText: { fontSize: 14, color: '#888' },
  mapSubText: { fontSize: 12, color: '#aaa', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  memberCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#333' },
  memberStatus: { fontSize: 12, fontWeight: '600' },
  memberLocation: { fontSize: 12, color: '#666', marginBottom: 2 },
  memberUpdate: { fontSize: 11, color: '#aaa' },
});
