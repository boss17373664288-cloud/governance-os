import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://10.0.2.2:3000/api/v1'; // Android emulator

export const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

api.interceptors.response.use(
  (r) => r.data,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('access_token');
    }
    throw error;
  }
);

export const authApi = {
  login: (employee_no: string, password: string) =>
    api.post('/auth/login', { employee_no, password }),
  logout: () => api.post('/auth/logout'),
};

export const customerApi = {
  list: (params?: any) => api.get('/customers', { params }),
  detail: (id: string) => api.get('/customers/' + id),
};

export const orderApi = {
  create: (data: any) => api.post('/sales-orders', data),
  list: (params?: any) => api.get('/sales-orders', { params }),
};

export const productApi = {
  list: (params?: any) => api.get('/products', { params }),
};

export const visitApi = {
  list: (params?: any) => api.get('/visits', { params }),
  create: (data: any) => api.post('/visits', data),
  checkin: (id: string) => api.put('/visits/' + id + '/checkin'),
  checkout: (id: string) => api.put('/visits/' + id + '/checkout'),
};

export const consignmentApi = {
  list: (params?: any) => api.get('/consignment', { params }),
  outbound: (data: any) => api.post('/consignment/outbound', data),
  exchange: (data: any) => api.post('/consignment/exchange', data),
};

export const sampleApi = {
  create: (data: any) => api.post('/sample-requests', data),
  list: (params?: any) => api.get('/sample-requests', { params }),
};

export const notificationApi = {
  list: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.put('/notifications/' + id + '/read'),
};

export const approvalApi = {
  approve: (id: string) => api.put('/approvals/' + id + '/approve'),
  reject: (id: string, reason: string) => api.put('/approvals/' + id + '/reject', { reason }),
};

export const recallApi = {
  list: (params?: any) => api.get('/recall', { params }),
  create: (data: any) => api.post('/recall', data),
  detail: (id: string) => api.get('/recall/' + id),
  submit: (id: string) => api.put('/recall/' + id + '/submit'),
  approve: (id: string) => api.put('/recall/' + id + '/approve'),
};

export const inventoryApi = {
  batches: (params?: any) => api.get('/inventory/batches', { params }),
  ledgers: (params?: any) => api.get('/inventory/ledgers', { params }),
};

export const ocrApi = {
  recognize: (formData: any) => api.post('/ocr/recognize', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  createDraft: (data: any) => api.post('/ocr/create-draft', data),
  history: (params?: any) => api.get('/ocr/history', { params }),
};