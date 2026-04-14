import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useNearbyShifts } from '../../hooks/useShifts';
import { formatPHP } from '../../lib/payments';
import { formatDistanceToNow } from 'date-fns';
import type { Shift } from '../../types';

function ShiftCard({ shift, onPress }: { shift: Shift; onPress: () => void }) {
  const hoursTotal = (
    (new Date(shift.time_end).getTime() - new Date(shift.time_start).getTime()) / 3600000
  ).toFixed(1);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-800">{shift.title}</Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            {(shift as any).businesses?.name ?? 'Business'}
          </Text>
        </View>
        <View className="bg-primary-50 rounded-lg px-3 py-1">
          <Text className="text-primary-600 font-bold text-sm">
            {formatPHP(shift.hourly_rate)}/hr
          </Text>
        </View>
      </View>

      <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
        {shift.description ?? shift.role_required}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-3">
          <Text className="text-xs text-gray-400">📍 {shift.address}</Text>
        </View>
        <Text className="text-xs text-gray-400">{hoursTotal}h shift</Text>
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-xs text-indigo-500 font-medium">
          {formatDistanceToNow(new Date(shift.time_start), { addSuffix: true })}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-xs text-gray-400">
            {shift.slots - shift.slots_filled} slot{shift.slots - shift.slots_filled !== 1 ? 's' : ''} left
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function WorkerFeedScreen() {
  const router = useRouter();
  const { shifts, loading, error, refetch } = useNearbyShifts(5000);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-500 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">Nearby Shifts</Text>
        <Text className="text-gray-500 text-sm mt-1">Within 5km of your location</Text>
      </View>

      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <ShiftCard
            shift={item}
            onPress={() => router.push(`/(worker)/shift/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">🔍</Text>
              <Text className="text-gray-500 text-center">No open shifts nearby right now.</Text>
              <Text className="text-gray-400 text-sm text-center mt-1">Pull to refresh.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
