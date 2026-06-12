'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/bi'); }, [router]);
  return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div></div></DashboardLayout>;
}