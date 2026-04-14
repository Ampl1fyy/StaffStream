import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatPHP } from '../../lib/payments';
import { format } from 'date-fns';
import type { Transaction } from '../../types';

export default function BusinessPaymentsScreen() {
  const { profile } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', profile.id)
      .single()
      .then(({ data: biz }) => {
        if (!biz) return;
        supabase
          .from('transactions')
          .select('*')
          .eq('business_id', biz.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            const txns = data ?? [];
            setTransactions(txns);
            setTotalPaid(txns.filter((t) => t.status === 'completed').reduce((s, t) => s + t.amount, 0));
            setLoading(false);
          });
      });
  }, [profile]);

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#4F46E5" /></View>;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">Payments</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="bg-primary-600 rounded-2xl p-4 mb-5">
            <Text className="text-primary-100 text-xs mb-1">Total Paid Out</Text>
            <Text className="text-white text-2xl font-bold">{formatPHP(totalPaid)}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 mb-3 flex-row justify-between items-center border border-gray-100">
            <View>
              <Text className="font-medium text-gray-800 capitalize">{item.payment_method} payout</Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
              </Text>
              {item.payment_reference && (
                <Text className="text-xs text-gray-400">Ref: {item.payment_reference}</Text>
              )}
            </View>
            <View className="items-end">
              <Text className="font-bold text-gray-800">{formatPHP(item.amount)}</Text>
              <Text className="text-xs text-gray-400">Fee: {formatPHP(item.platform_fee)}</Text>
              <StatusBadge status={item.status} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">💳</Text>
            <Text className="text-gray-500">No payments yet.</Text>
          </View>
        }
      />
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'completed' ? 'text-green-600' : status === 'pending' ? 'text-yellow-600' : 'text-red-600';
  return <Text className={`text-xs capitalize mt-1 ${cls}`}>{status}</Text>;
}
