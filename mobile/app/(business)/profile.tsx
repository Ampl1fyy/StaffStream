import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { getCurrentLocation } from '../../lib/maps';
import type { Business } from '../../types';

export default function BusinessProfileScreen() {
  const { profile, signOut } = useAuthStore();
  const [business, setBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState({ name: '', description: '', industry: '', address: '', city: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase.from('businesses').select('*').eq('owner_id', profile.id).maybeSingle()
      .then(({ data }) => {
        setBusiness(data);
        if (data) setForm({ name: data.name, description: data.description ?? '', industry: data.industry ?? '', address: data.address, city: data.city });
      });
  }, [profile]);

  async function handleSave() {
    if (!form.name || !form.address || !form.city) {
      Alert.alert('Error', 'Name, address, and city are required.');
      return;
    }
    setSaving(true);

    const coords = await getCurrentLocation();
    const location = coords
      ? `POINT(${coords.longitude} ${coords.latitude})`
      : 'POINT(121.0437 14.5547)'; // Manila default

    if (business) {
      await supabase.from('businesses').update({ ...form, location }).eq('id', business.id);
      Alert.alert('Saved', 'Business profile updated.');
    } else {
      const { data, error } = await supabase.from('businesses').insert({
        owner_id: profile!.id,
        ...form,
        location,
      }).select().single();
      if (error) Alert.alert('Error', error.message);
      else { setBusiness(data); Alert.alert('Created', 'Business profile created!'); }
    }
    setSaving(false);
  }

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">Business Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View className="bg-white rounded-2xl p-4 gap-y-4 mb-4">
          <Field label="Business Name *" value={form.name} onChangeText={(v) => update('name', v)} placeholder="My Shop Inc." />
          <Field label="Industry" value={form.industry} onChangeText={(v) => update('industry', v)} placeholder="Retail, F&B, Events..." />
          <Field label="Description" value={form.description} onChangeText={(v) => update('description', v)} placeholder="What does your business do?" multiline />
        </View>

        <View className="bg-white rounded-2xl p-4 gap-y-4 mb-6">
          <Field label="Address *" value={form.address} onChangeText={(v) => update('address', v)} placeholder="123 Main St, Brgy..." />
          <Field label="City *" value={form.city} onChangeText={(v) => update('city', v)} placeholder="Quezon City" />
          <Text className="text-xs text-gray-400">Location will be set to your current GPS coordinates when saved.</Text>
        </View>

        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-4 items-center mb-3"
          onPress={handleSave}
          disabled={saving}
        >
          <Text className="text-white font-semibold">{saving ? 'Saving...' : business ? 'Update Business' : 'Create Business'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-red-300 rounded-xl py-4 items-center"
          onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
          ])}
        >
          <Text className="text-red-500 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; multiline?: boolean;
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
      />
    </View>
  );
}
