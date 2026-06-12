import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Platform, Animated,
} from 'react-native';
import { authApi } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#165DFF',
  danger: '#F53F3F',
  text: '#1D2129',
  bg: '#FFFFFF',
  placeholder: '#C9CDD4',
  divider: '#E5E6EB',
  disabled: '#F2F3F5',
};

export default function LoginScreen({ navigation }: any) {
  const [no, setNo] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const sosTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sosAnim = useRef(new Animated.Value(0)).current;

  const handleLogin = async () => {
    if (!no.trim() || !pw.trim()) {
      Alert.alert('提示', '請完善帳號密碼');
      return;
    }
    setLoading(true);
    try {
      const res: any = await authApi.login(no.trim(), pw);
      await AsyncStorage.setItem('access_token', res.data.access_token);
      await AsyncStorage.setItem('refresh_token', res.data.refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.employee));
      const role = res.data.employee.role_code;
      if (role === 'WAREHOUSE') navigation.replace('Warehouse');
      else if (role === 'GM' || role === 'EXECUTIVE_DIRECTOR') navigation.replace('CEO');
      else navigation.replace('Business');
    } catch (e: any) {
      const msg = e.response?.data?.message || '網路異常，請稍後再試';
      Alert.alert('登入失敗', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSosPressIn = () => {
    sosTimer.current = setTimeout(() => {
      setSosActive(true);
    }, 3000);
    Animated.timing(sosAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();
  };

  const handleSosPressOut = () => {
    if (sosTimer.current) {
      clearTimeout(sosTimer.current);
      sosTimer.current = null;
    }
    sosAnim.setValue(0);
  };

  if (sosActive) {
    return (
      <View style={[styles.container, styles.sosOverlay]}>
        <Text style={styles.sosTitle}>系統維護中</Text>
        <Text style={styles.sosSub}>已通知安全管理員，請保持冷靜</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* 標題區 */}
        <View style={styles.headerArea}>
          <Text style={styles.mainTitle}>企業業務系統</Text>
          <Text style={styles.subTitle}>員工登錄入口</Text>
        </View>

        {/* 表單區 */}
        <View style={styles.formArea}>
          <TextInput
            style={styles.input}
            placeholder="請輸入員工編號"
            placeholderTextColor={COLORS.placeholder}
            value={no}
            onChangeText={setNo}
            autoCapitalize="none"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="請輸入登錄密碼"
            placeholderTextColor={COLORS.placeholder}
            value={pw}
            onChangeText={setPw}
            secureTextEntry
            editable={!loading}
          />

          {/* 登入按鈕 */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>登錄</Text>
          </TouchableOpacity>

          {/* 載入狀態 */}
          {loading && (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>登錄中，請稍候...</Text>
            </View>
          )}
        </View>

        {/* SOS 區域 */}
        <TouchableOpacity
          style={styles.sosArea}
          onPressIn={handleSosPressIn}
          onPressOut={handleSosPressOut}
          activeOpacity={1}
        >
          <Animated.View style={[
            styles.sosProgress,
            { width: sosAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]} />
          <Text style={styles.sosText}>長按 3 秒觸發 SOS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    color: COLORS.placeholder,
  },
  formArea: {
    width: '100%',
  },
  input: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 24,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnDisabled: {
    backgroundColor: COLORS.placeholder,
  },
  loginBtnText: {
    color: COLORS.bg,
    fontSize: 17,
    fontWeight: '600',
  },
  loadingArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  loadingText: {
    color: COLORS.placeholder,
    fontSize: 14,
  },
  sosArea: {
    position: 'absolute',
    bottom: 60,
    left: 32,
    right: 32,
    alignItems: 'center',
    paddingVertical: 16,
    overflow: 'hidden',
    borderRadius: 4,
  },
  sosProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(245,63,63,0.08)',
  },
  sosText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '500',
  },
  sosOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
  },
  sosTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.bg,
    marginBottom: 12,
  },
  sosSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
});