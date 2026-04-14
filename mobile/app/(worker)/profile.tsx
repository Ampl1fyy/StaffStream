import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import type { PaymentMethod } from '../../types';

export default function WorkerProfileScreen() {
  const { profile, setProfile, signOut } = useAuthStore();
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [walletNumber, setWalletNumber] = useState(profile?.e_wallet_number ?? '');
  const [walletProvider, setWalletProvider] = useState<PaymentMethod>(profile?.e_wallet_provider ?? 'gcash');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ phone, bio, e_wallet_number: walletNumber, e_wallet_provider: walletProvider })
      .eq('id', profile.id)
      .select()
      .single();
    if (error) Alert.alert('Error', error.message);
    else { setProfile(data); Alert.alert('Saved', 'Profile updated.'); }
    setSaving(false);
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Stats */}
        <View className="flex-row gap-x-3 mb-5">
          <StatCard label="Rating" value={profile?.average_rating?.toFixed(1) ?? '–'} icon="⭐" />
          <StatCard label="Reliability" value={`${profile?.reliability_score?.toFixed(1) ?? '–'}/5`} icon="🏆" />
          <StatCard label="KYC" value={profile?.kyc_status ?? 'unverified'} icon="🪪" />
        </View>

        <View className="bg-white rounded-2xl p-4 gap-y-4 mb-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Full Name</Text>
            <Text className="text-gray-800 font-medium">{profile?.full_name}</Text>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Phone</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-base"
              placeholder="+639XXXXXXXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Bio</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-base"
              placeholder="Tell businesses about yourself..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* E-wallet */}
        <View className="bg-white rounded-2xl p-4 gap-y-4 mb-4">
          <Text className="font-semibold text-gray-800">Payout Account</Text>
          <View className="flex-row gap-x-3">
            {(['gcash', 'maya'] as PaymentMethod[]).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setWalletProvider(p)}
                className={`flex-1 py-2.5 rounded-xl border items-center ${
                  walletProvider === p ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                }`}
              >
                <Text className={`font-medium uppercase text-sm ${walletProvider === p ? 'text-white' : 'text-gray-700'}`}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Mobile Number</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-base"
              placeholder="+639XXXXXXXXX"
              value={walletNumber}
              onChangeText={setWalletNumber}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-4 items-center mb-3"
          onPress={handleSave}
          disabled={saving}
        >
          <Text className="text-white font-semibold">{saving ? 'Saving...' : 'Save Changes'}</Text>
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
    </View>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-3 items-center border border-gray-100">
      <Text className="text-xl">{icon}</Text>
      <Text className="font-bold text-gray-800 mt-1">{value}</Text>
      <Text className="text-xs text-gray-400 capitalize">{label}</Text>
    </View>
  );
}
