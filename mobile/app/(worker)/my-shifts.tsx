import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useMyApplications } from '../../hooks/useShifts';
import { format } from 'date-fns';
import type { ApplicationStatus } from '../../types';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-500',
};

export default function MyShiftsScreen() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const { applications, loading } = useMyApplications(profile?.id ?? '');

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">My Shifts</Text>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}
        renderItem={({ item }: { item: any }) => {
          const shift = item.shifts;
          if (!shift) return null;
          const colors = STATUS_COLORS[item.status as ApplicationStatus];

          return (
            <TouchableOpacity
              onPress={() => router.push(`/(worker)/shift/${shift.id}`)}
              className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
            >
              <View className="flex-row justify-between items-start mb-1">
                <Text className="font-semibold text-gray-800 flex-1">{shift.title}</Text>
                <View className={`rounded-full px-2.5 py-0.5 ${colors.split(' ')[0]}`}>
                  <Text className={`text-xs font-medium capitalize ${colors.split(' ')[1]}`}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-gray-500">{shift.businesses?.name}</Text>
              <Text className="text-xs text-gray-400 mt-2">
                {format(new Date(shift.time_start), 'MMM d, h:mm a')} –{' '}
                {format(new Date(shift.time_end), 'h:mm a')}
              </Text>

              {item.status === 'approved' && !item.checked_in_at && (
                <TouchableOpacity
                  className="mt-3 bg-primary-600 rounded-xl py-2.5 items-center"
                  onPress={() => router.push('/qr-scan')}
                >
                  <Text className="text-white font-medium text-sm">Scan QR to Check In</Text>
                </TouchableOpacity>
              )}

              {item.checked_in_at && !item.checked_out_at && (
                <TouchableOpacity
                  className="mt-3 bg-green-600 rounded-xl py-2.5 items-center"
                  onPress={() => router.push('/qr-scan')}
                >
                  <Text className="text-white font-medium text-sm">Scan QR to Check Out</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">📋</Text>
              <Text className="text-gray-500">No applications yet.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
