"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import toast from "react-hot-toast";
// Safe toast wrapper
const safeToast = { error: (msg: string) => { try { toast.error(msg); } catch {} } };

// Use relative URL so Next.js rewrite proxies to backend
const API_BASE = "/api/v1";

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

api.interceptors.response.use(
  (r) => r.data,
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || "请求失败";
    // 401 = redirect to login silently
    if (status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    }
    // Other errors = show toast
    // Skip toast for enum-options (handled by component)
    if (!error.config?.url?.includes("enum-options")) {
      safeToast.error(msg);
    }
    return Promise.reject(error);
  }
);

interface AuthState {
  user: any | null;
  token: string | null;
  login: (employee_no: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (employee_no, password) => {
    const res = await axios.post(API_BASE + "/auth/login", { employee_no, password });
    const { access_token, employee } = res.data.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user", JSON.stringify(employee));
    set({ user: employee, token: access_token });
  },
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },
}));
