import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then(d => { if (d) setUser(JSON.parse(d)); });
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'U'}</Text></View>
        <Text style={styles.userName}>{user?.full_name || '用户'}</Text>
        <Text style={styles.userRole}>{user?.role_name || '业务员'}</Text>
      </View>
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>👤 个人资料</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DeviceBinding')}>
          <Text style={styles.menuText}>📱 帐号安全</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.menuText}>🔔 消息中心</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>⚙️ 设定</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>ℹ️ 关于</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  avatarSection: { alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  userName: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 12 },
  userRole: { fontSize: 13, color: '#888', marginTop: 4 },
  menuSection: { marginTop: 12, backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 12 },
  menuItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { fontSize: 15, color: '#333' },
});
