import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

export default function DeviceBindingScreen({ navigation }: any) {
  const [devices] = useState([
    { id: '1', name: 'iPhone 15 Pro', model: 'iOS 18.2', ip: '192.168.1.5', lastLogin: '2026-06-07 15:30', current: true },
    { id: '2', name: 'iPad Air', model: 'iPadOS 18.1', ip: '192.168.1.8', lastLogin: '2026-06-05 09:15', current: false },
  ]);

  const unbind = (id: string, name: string) => {
    Alert.alert('解绑确认', '确定要解绑 ' + name + ' 吗？', [
      { text: '取消' },
      { text: '解绑', style: 'destructive', onPress: () => Alert.alert('已解绑', name + ' 已解绑') }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📱 帐号安全</Text>
      <View style={styles.limitInfo}>
        <Text style={styles.limitText}>已绑定 {devices.length}/3 台设备</Text>
        <Text style={styles.limitHint}>最多可绑定3台设备，超限时新设备无法登入</Text>
      </View>
      {devices.map(d => (
        <View key={d.id} style={[styles.deviceCard, d.current && styles.deviceCardCurrent]}>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{d.current ? '🟢 ' : '⚪ '}{d.name}</Text>
            <Text style={styles.deviceModel}>{d.model}</Text>
            <Text style={styles.deviceMeta}>IP: {d.ip} | 上次登入: {d.lastLogin}</Text>
          </View>
          {!d.current && (
            <TouchableOpacity style={styles.unbindBtn} onPress={() => unbind(d.id, d.name)}>
              <Text style={styles.unbindText}>解绑</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  limitInfo: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginBottom: 12 },
  limitText: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
  limitHint: { fontSize: 12, color: '#888', marginTop: 4 },
  deviceCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deviceCardCurrent: { borderWidth: 1, borderColor: '#16a34a' },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 14, fontWeight: '600', color: '#333' },
  deviceModel: { fontSize: 12, color: '#888', marginTop: 2 },
  deviceMeta: { fontSize: 11, color: '#aaa', marginTop: 2 },
  unbindBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444' },
  unbindText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
});
