import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Stats {
  totalUsers: number;
  totalWorkers: number;
  totalBusinesses: number;
  openShifts: number;
  completedShifts: number;
  openDisputes: number;
  totalTransactions: number;
  totalRevenue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [
        { count: totalUsers },
        { count: totalWorkers },
        { count: totalBusinesses },
        { count: openShifts },
        { count: completedShifts },
        { count: openDisputes },
        { data: txnData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'worker'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'business'),
        supabase.from('shifts').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('shifts').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('transactions').select('net_amount').eq('status', 'completed'),
      ]);

      const totalRevenue = (txnData ?? []).reduce((s, t) => s + t.net_amount * 0.05, 0);

      setStats({
        totalUsers: totalUsers ?? 0,
        totalWorkers: totalWorkers ?? 0,
        totalBusinesses: totalBusinesses ?? 0,
        openShifts: openShifts ?? 0,
        completedShifts: completedShifts ?? 0,
        openDisputes: openDisputes ?? 0,
        totalTransactions: (txnData ?? []).length,
        totalRevenue,
      });
    }
    load();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats?.totalUsers ?? '–'} icon="👥" color="bg-blue-50 text-blue-600" />
        <StatCard label="Workers" value={stats?.totalWorkers ?? '–'} icon="👷" color="bg-indigo-50 text-indigo-600" />
        <StatCard label="Businesses" value={stats?.totalBusinesses ?? '–'} icon="🏢" color="bg-purple-50 text-purple-600" />
        <StatCard label="Open Shifts" value={stats?.openShifts ?? '–'} icon="📋" color="bg-green-50 text-green-600" />
        <StatCard label="Completed Shifts" value={stats?.completedShifts ?? '–'} icon="✅" color="bg-teal-50 text-teal-600" />
        <StatCard label="Open Disputes" value={stats?.openDisputes ?? '–'} icon="⚖️" color="bg-red-50 text-red-600" />
        <StatCard label="Transactions" value={stats?.totalTransactions ?? '–'} icon="💸" color="bg-yellow-50 text-yellow-600" />
        <StatCard
          label="Platform Revenue"
          value={stats ? `₱${stats.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '–'}
          icon="💰"
          color="bg-emerald-50 text-emerald-600"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-lg mb-3 ${color.split(' ')[0]}`}>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
