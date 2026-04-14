import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { format, subDays, startOfDay } from 'date-fns';

export default function Analytics() {
  const [shiftsData, setShiftsData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const days = 14;
      const from = subDays(new Date(), days).toISOString();

      const [{ data: shifts }, { data: txns }] = await Promise.all([
        supabase.from('shifts').select('created_at, status').gte('created_at', from),
        supabase.from('transactions').select('created_at, net_amount, status').gte('created_at', from).eq('status', 'completed'),
      ]);

      // Build daily buckets
      const shiftsByDay: Record<string, { date: string; posted: number; completed: number }> = {};
      const revenueByDay: Record<string, { date: string; revenue: number; txns: number }> = {};

      for (let i = days; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'MMM d');
        shiftsByDay[d] = { date: d, posted: 0, completed: 0 };
        revenueByDay[d] = { date: d, revenue: 0, txns: 0 };
      }

      (shifts ?? []).forEach((s) => {
        const d = format(new Date(s.created_at), 'MMM d');
        if (shiftsByDay[d]) {
          shiftsByDay[d].posted++;
          if (s.status === 'completed') shiftsByDay[d].completed++;
        }
      });

      (txns ?? []).forEach((t) => {
        const d = format(new Date(t.created_at), 'MMM d');
        if (revenueByDay[d]) {
          revenueByDay[d].revenue += t.net_amount * 0.05;
          revenueByDay[d].txns++;
        }
      });

      setShiftsData(Object.values(shiftsByDay));
      setRevenueData(Object.values(revenueByDay));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>

      {/* Shifts chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Shifts (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={shiftsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="posted" fill="#6366f1" name="Posted" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Platform Revenue (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${v}`} />
            <Tooltip formatter={(v: number) => [`₱${v.toFixed(2)}`, 'Revenue']} />
            <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} dot={false} name="Revenue (₱)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
