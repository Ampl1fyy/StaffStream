import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { formatPHP } from '../../../lib/payments';
import { format } from 'date-fns';
import type { Shift, Application } from '../../../types';

export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuthStore();
  const [shift, setShift] = useState<Shift | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: shiftData }, { data: appData }] = await Promise.all([
        supabase.from('shifts').select('*, businesses(*), skills(*)').eq('id', id).single(),
        profile
          ? supabase.from('applications').select('*').eq('shift_id', id).eq('worker_id', profile.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setShift(shiftData);
      setApplication(appData);
      setLoading(false);
    }
    load();
  }, [id, profile]);

  async function handleApply() {
    if (!profile) return;
    setApplying(true);
    const { error } = await supabase.from('applications').insert({
      shift_id: id,
      worker_id: profile.id,
    });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Applied!', 'Your application has been submitted. Wait for business confirmation.');
      setApplication({ status: 'pending' } as Application);
    }
    setApplying(false);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }
  if (!shift) return null;

  const hoursTotal = (
    (new Date(shift.time_end).getTime() - new Date(shift.time_start).getTime()) / 3600000
  ).toFixed(1);
  const estimatedPay = parseFloat(hoursTotal) * shift.hourly_rate;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Back */}
        <View className="bg-white px-5 pt-14 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary-600 font-medium">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">{shift.title}</Text>
          <Text className="text-gray-500 mt-1">{(shift as any).businesses?.name}</Text>
        </View>

        <View className="px-5 py-4 gap-y-4">
          {/* Pay */}
          <View className="bg-primary-50 rounded-2xl p-4 flex-row justify-between">
            <View>
              <Text className="text-xs text-gray-500">Hourly Rate</Text>
              <Text className="text-2xl font-bold text-primary-600">{formatPHP(shift.hourly_rate)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-gray-500">Est. Earnings</Text>
              <Text className="text-2xl font-bold text-success">{formatPHP(estimatedPay)}</Text>
            </View>
          </View>

          {/* Details */}
          <View className="bg-white rounded-2xl p-4 gap-y-3">
            <DetailRow icon="🗓" label="Date" value={format(new Date(shift.time_start), 'MMMM d, yyyy')} />
            <DetailRow icon="🕐" label="Time" value={`${format(new Date(shift.time_start), 'h:mm a')} – ${format(new Date(shift.time_end), 'h:mm a')} (${hoursTotal}h)`} />
            <DetailRow icon="📍" label="Location" value={shift.address} />
            <DetailRow icon="👥" label="Slots" value={`${shift.slots_filled}/${shift.slots} filled`} />
            {shift.skills && <DetailRow icon="🏷" label="Skill" value={(shift as any).skills?.name} />}
          </View>

          {/* Description */}
          {shift.description && (
            <View className="bg-white rounded-2xl p-4">
              <Text className="font-semibold text-gray-800 mb-2">About this shift</Text>
              <Text className="text-gray-600 leading-6">{shift.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      <View className="px-5 pb-8 pt-3 bg-white border-t border-gray-100">
        {application ? (
          <View className="bg-gray-100 rounded-xl py-4 items-center">
            <Text className="text-gray-600 font-medium capitalize">
              Status: {application.status}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 items-center"
            onPress={handleApply}
            disabled={applying || shift.status !== 'open'}
          >
            <Text className="text-white font-semibold text-base">
              {applying ? 'Applying...' : 'Apply for this Shift'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-start">
      <Text className="w-6 mr-2">{icon}</Text>
      <View className="flex-1">
        <Text className="text-xs text-gray-400">{label}</Text>
        <Text className="text-gray-700 font-medium">{value}</Text>
      </View>
    </View>
  );
}
