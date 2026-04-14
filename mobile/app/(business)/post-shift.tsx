import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import type { Skill } from '../../types';

export default function PostShiftScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    role_required: '',
    skill_id: null as number | null,
    slots: '1',
    hourly_rate: '',
    time_start: '',
    time_end: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('skills').select('*').order('category').then(({ data }) => setSkills(data ?? []));
  }, []);

  async function handlePost() {
    const { title, role_required, slots, hourly_rate, time_start, time_end, address } = form;
    if (!title || !role_required || !hourly_rate || !time_start || !time_end || !address) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, location')
      .eq('owner_id', profile!.id)
      .single();

    if (!biz) {
      Alert.alert('Error', 'Business profile not found. Set up your business first.');
      setLoading(false);
      return;
    }

    const qrCode = crypto.randomUUID();

    const { error } = await supabase.from('shifts').insert({
      business_id: biz.id,
      title,
      description: form.description,
      role_required,
      skill_id: form.skill_id,
      slots: parseInt(slots),
      hourly_rate: parseFloat(hourly_rate),
      time_start: new Date(time_start).toISOString(),
      time_end: new Date(time_end).toISOString(),
      address,
      location: biz.location,
      qr_code: qrCode,
    });

    if (error) Alert.alert('Error', error.message);
    else {
      Alert.alert('Shift Posted!', 'Workers near you will be notified.', [
        { text: 'OK', onPress: () => router.push('/(business)') },
      ]);
    }
    setLoading(false);
  }

  function update(key: string, value: string | number | null) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">Post a Shift</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View className="bg-white rounded-2xl p-4 gap-y-4 mb-4">
          <Field label="Shift Title *" value={form.title} onChangeText={(v) => update('title', v)} placeholder="e.g. Cashier for Weekend Sale" />
          <Field label="Role Required *" value={form.role_required} onChangeText={(v) => update('role_required', v)} placeholder="e.g. Cashier" />
          <Field label="Description" value={form.description} onChangeText={(v) => update('description', v)} placeholder="Additional details..." multiline />
        </View>

        <View className="bg-white rounded-2xl p-4 gap-y-4 mb-4">
          <Field label="Hourly Rate (PHP) *" value={form.hourly_rate} onChangeText={(v) => update('hourly_rate', v)} placeholder="100" keyboardType="numeric" />
          <Field label="Number of Slots *" value={form.slots} onChangeText={(v) => update('slots', v)} keyboardType="numeric" />
        </View>

        <View className="bg-white rounded-2xl p-4 gap-y-4 mb-4">
          <Field label="Start (YYYY-MM-DD HH:MM) *" value={form.time_start} onChangeText={(v) => update('time_start', v)} placeholder="2024-12-25 09:00" />
          <Field label="End (YYYY-MM-DD HH:MM) *" value={form.time_end} onChangeText={(v) => update('time_end', v)} placeholder="2024-12-25 17:00" />
        </View>

        <View className="bg-white rounded-2xl p-4 gap-y-4 mb-4">
          <Field label="Location Address *" value={form.address} onChangeText={(v) => update('address', v)} placeholder="123 Main St, Quezon City" />
        </View>

        {/* Skill selector */}
        <View className="bg-white rounded-2xl p-4 mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Required Skill (optional)</Text>
          <View className="flex-row flex-wrap gap-2">
            {skills.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => update('skill_id', form.skill_id === s.id ? null : s.id)}
                className={`px-3 py-1.5 rounded-full border ${
                  form.skill_id === s.id
                    ? 'bg-primary-600 border-primary-600'
                    : 'border-gray-300'
                }`}
              >
                <Text className={`text-xs font-medium ${form.skill_id === s.id ? 'text-white' : 'text-gray-700'}`}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-4 items-center"
          onPress={handlePost}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-base">{loading ? 'Posting...' : 'Post Shift'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChangeText, placeholder, multiline, keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
}) {
  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <TextInput
        className="border border-gray-200 rounded-xl px-3 py-2.5 text-base"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}
