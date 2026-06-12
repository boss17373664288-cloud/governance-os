import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { api } from '../../services/api';

export default function PendingApprovalsScreen({ navigation }: any) {
  const [approvals, setApprovals] = useState<any[]>([]);

  useEffect(() => {
    api.get('/notifications', { params: { type: 'approval', page_size: 50 } }).then((r: any) => {
      setApprovals(r.data?.items || []);
    }).catch(() => {});
  }, []);

  const handleApprove = async (id: string, type: string) => {
    try {
      await api.put('/approvals/' + id + '/approve');
      Alert.alert('成功', '已批准');
    } catch (e: any) { Alert.alert('错误', e?.response?.data?.message || '操作失败'); }
  };

  const handleReject = async (id: string, type: string) => {
    Alert.prompt ? Alert.prompt('驳回原因', '请输入驳回原因:', (text: string) => {
      api.put('/approvals/' + id + '/reject', { reason: text }).then(() => Alert.alert('已驳回')).catch(() => {});
    }) : Alert.alert('确认', '确定要驳回？');
  };

  const mockApprovals = [
    { id: '1', type: '低价审批', title: '订单 #SO-20260607-001', amount: 8500, submitter: '张业务', time: '10分钟前' },
    { id: '2', type: '寄库出库', title: '台大医院 - 寄库出库', amount: null, submitter: '李业务', time: '30分钟前' },
    { id: '3', type: '打板审批', title: '打板申请 #SP-20260607-001', amount: null, submitter: '王业务', time: '1小时前' },
  ];

  const items = approvals.length > 0 ? approvals : mockApprovals;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>✅ 待审批</Text>
      {items.map((a: any) => (
        <View key={a.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardType}>{a.type}</Text>
            <Text style={styles.cardTime}>{a.time || a.created_at}</Text>
          </View>
          <Text style={styles.cardTitle}>{a.title}</Text>
          {a.amount && <Text style={styles.cardAmount}>¥{a.amount?.toLocaleString()}</Text>}
          <Text style={styles.cardSubmitter}>提交人: {a.submitter || a.created_by}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(a.id, a.type)}>
              <Text style={styles.rejectBtnText}>驳回</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(a.id, a.type)}>
              <Text style={styles.approveBtnText}>通过</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {items.length === 0 && <Text style={styles.emptyText}>暂无待审批项目</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardType: { fontSize: 12, color: '#f59e0b', fontWeight: '600' },
  cardTime: { fontSize: 11, color: '#aaa' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  cardAmount: { fontSize: 16, fontWeight: '700', color: '#ef4444', marginBottom: 4 },
  cardSubmitter: { fontSize: 12, color: '#888', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  rejectBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444' },
  rejectBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  approveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#16a34a' },
  approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#999', padding: 40, fontSize: 14 },
});
