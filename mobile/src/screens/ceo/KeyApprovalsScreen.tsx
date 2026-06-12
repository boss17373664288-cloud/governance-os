import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

export default function KeyApprovalsScreen({ navigation }: any) {
  const [verified, setVerified] = useState(false);

  const approvals = [
    { id: '1', type: 'R4 紧急召回', title: 'RC4000001 - 心率监测仪', level: 'R4', submitter: '品保总监' },
    { id: '2', type: '紧急采购', title: 'PO-20260607-001', amount: 350000, submitter: '采购经理' },
    { id: '3', type: '大额超预算', title: '预算调整 #BGT-001', amount: 500000, submitter: '财务总监' },
  ];

  const handleApprove = (id: string) => {
    if (!verified) {
      Alert.alert('安全验证', '需要进行生物识别验证 (FaceID/指纹) 才能审批', [
        { text: '取消' },
        { text: '验证', onPress: () => { setVerified(true); Alert.alert('验证成功', '生物识别已通过，现在可以审批了'); } }
      ]);
      return;
    }
    Alert.alert('确认', '确定批准此项？', [
      { text: '取消' },
      { text: '批准', onPress: () => Alert.alert('已批准', '审批已完成') }
    ]);
  };

  const handleReject = (id: string) => {
    Alert.alert('确认', '确定驳回此项？', [
      { text: '取消' },
      { text: '驳回', onPress: () => Alert.alert('已驳回', '审批已驳回') }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔐 关键审批</Text>
      <View style={[styles.verifyBar, verified && styles.verifyBarDone]}>
        <Text style={styles.verifyText}>{verified ? '✅ 生物识别已通过' : '🔒 需生物识别验证后审批'}</Text>
        {!verified && <TouchableOpacity style={styles.verifyBtn} onPress={() => { setVerified(true); Alert.alert('已验证'); }}>
          <Text style={styles.verifyBtnText}>验证</Text>
        </TouchableOpacity>}
      </View>
      {approvals.map(a => (
        <View key={a.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardType, { color: a.type.includes('R4') ? '#ef4444' : '#f59e0b' }]}>{a.type}</Text>
          </View>
          <Text style={styles.cardTitle}>{a.title}</Text>
          {a.amount && <Text style={styles.cardAmount}>¥{a.amount.toLocaleString()}</Text>}
          <Text style={styles.cardSubmitter}>提交人: {a.submitter}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(a.id)}>
              <Text style={styles.rejectBtnText}>驳回</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(a.id)}>
              <Text style={styles.approveBtnText}>批准</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  verifyBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fef2f2', borderRadius: 10, marginBottom: 12 },
  verifyBarDone: { backgroundColor: '#f0fdf4' },
  verifyText: { fontSize: 13, color: '#666' },
  verifyBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  verifyBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  cardHeader: { marginBottom: 6 },
  cardType: { fontSize: 13, fontWeight: '600' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  cardAmount: { fontSize: 18, fontWeight: '700', color: '#ef4444', marginBottom: 4 },
  cardSubmitter: { fontSize: 12, color: '#888', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  rejectBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444' },
  rejectBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  approveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#16a34a' },
  approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
