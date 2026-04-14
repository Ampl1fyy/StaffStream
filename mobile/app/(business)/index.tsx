import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import type { Shift, Business } from '../../types';

export default function BusinessDashboard() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [business, setBusiness] = useState<Business | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!profile) return;
    setLoading(true);
    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', profile.id)
      .maybeSingle();
    setBusiness(biz);

    if (biz) {
      const { data } = await supabase
        .from('shifts')
        .select('*, applications(count)')
        .eq('business_id', biz.id)
        .order('time_start', { ascending: false })
        .limit(20);
      setShifts(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [profile]);

  if (!business) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-gray-800 mb-2">Set up your business</Text>
        <Text className="text-gray-500 text-center mb-6">Complete your business profile to start posting shifts.</Text>
        <TouchableOpacity
          className="bg-primary-600 px-6 py-4 rounded-xl"
          onPress={() => router.push('/(business)/profile')}
        >
          <Text className="text-white font-semibold">Set Up Business</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeShifts = shifts.filter((s) => s.status === 'active' || s.status === 'open');
  const completedShifts = shifts.filter((s) => s.status === 'completed');

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-800">{business.name}</Text>
        <Text className="text-gray-500 text-sm mt-0.5">Business Dashboard</Text>
      </View>

      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <View className="flex-row gap-x-3 mb-5">
            <StatCard label="Active Shifts" value={String(activeShifts.length)} color="bg-primary-50" textColor="text-primary-600" />
            <StatCard label="Completed" value={String(completedShifts.length)} color="bg-green-50" textColor="text-green-600" />
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
            onPress={() => router.push(`/(business)/shift/${item.id}`)}
          >
            <View className="flex-row justify-between items-start mb-1">
              <Text className="font-semibold text-gray-800 flex-1">{item.title}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text className="text-xs text-gray-400">
              {format(new Date(item.time_start), 'MMM d, h:mm a')}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              {item.slots_filled}/{item.slots} workers •{' '}
              {(item as any).applications?.[0]?.count ?? 0} applicants
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">📋</Text>
              <Text className="text-gray-500">No shifts posted yet.</Text>
              <TouchableOpacity
                className="mt-4 bg-primary-600 px-6 py-3 rounded-xl"
                onPress={() => router.push('/(business)/post-shift')}
              >
                <Text className="text-white font-medium">Post your first shift</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function StatCard({ label, value, color, textColor }: { label: string; value: string; color: string; textColor: string }) {
  return (
    <View className={`flex-1 ${color} rounded-2xl p-4`}>
      <Text className={`text-2xl font-bold ${textColor}`}>{value}</Text>
      <Text className="text-xs text-gray-500 mt-0.5">{label}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    filled: 'bg-purple-100 text-purple-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  };
  const cls = colors[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${cls.split(' ')[0]}`}>
      <Text className={`text-xs capitalize ${cls.split(' ')[1]}`}>{status}</Text>
    </View>
  );
}
