import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatPHP } from '../../lib/payments';
import { format } from 'date-fns';
import type { Transaction } from '../../types';

export default function EarningsScreen() {
  const { profile } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ total: 0, pending: 0 });

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('transactions')
      .select('*')
      .eq('worker_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const txns = data ?? [];
        setTransactions(txns);
        const total = txns.filter((t) => t.status === 'completed').reduce((s, t) => s + t.net_amount, 0);
        const pending = txns.filter((t) => t.status === 'pending' || t.status === 'processing').reduce((s, t) => s + t.net_amount, 0);
        setTotals({ total, pending });
        setLoading(false);
      });
  }, [profile]);

  if (loading) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#4F46E5" /></View>;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">Earnings</Text>
      </View>

      {/* Summary */}
      <View className="flex-row gap-x-3 px-5 py-4">
        <View className="flex-1 bg-primary-600 rounded-2xl p-4">
          <Text className="text-primary-100 text-xs mb-1">Total Earned</Text>
          <Text className="text-white text-xl font-bold">{formatPHP(totals.total)}</Text>
        </View>
        <View className="flex-1 bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
          <Text className="text-yellow-600 text-xs mb-1">Pending</Text>
          <Text className="text-yellow-700 text-xl font-bold">{formatPHP(totals.pending)}</Text>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 mb-3 flex-row justify-between items-center border border-gray-100">
            <View>
              <Text className="font-medium text-gray-800 capitalize">{item.payment_method} payout</Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                {format(new Date(item.created_at), 'MMM d, yyyy')}
              </Text>
              {item.payment_reference && (
                <Text className="text-xs text-gray-400">Ref: {item.payment_reference}</Text>
              )}
            </View>
            <View className="items-end">
              <Text className="font-bold text-gray-800">{formatPHP(item.net_amount)}</Text>
              <View className={`rounded-full px-2 py-0.5 mt-1 ${
                item.status === 'completed' ? 'bg-green-100' :
                item.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Text className={`text-xs capitalize ${
                  item.status === 'completed' ? 'text-green-700' :
                  item.status === 'pending' ? 'text-yellow-700' : 'text-red-700'
                }`}>{item.status}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">💰</Text>
            <Text className="text-gray-500">No transactions yet.</Text>
          </View>
        }
      />
    </View>
  );
}
