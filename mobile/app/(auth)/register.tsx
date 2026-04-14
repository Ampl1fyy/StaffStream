import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';
import type { UserRole } from '../../types';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('worker');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Name, email and password are required.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, phone },
      },
    });
    if (error) Alert.alert('Registration Failed', error.message);
    else Alert.alert('Success', 'Account created! Please check your email to verify.');
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-16 pb-8">
          <Text className="text-2xl font-semibold text-gray-800 mb-2">Create account</Text>
          <Text className="text-gray-500 mb-8">Join StaffStream today.</Text>

          {/* Role selector */}
          <Text className="text-sm font-medium text-gray-700 mb-2">I am a...</Text>
          <View className="flex-row gap-x-3 mb-5">
            {(['worker', 'business'] as UserRole[]).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                className={`flex-1 py-3 rounded-xl border items-center ${
                  role === r
                    ? 'bg-primary-600 border-primary-600'
                    : 'border-gray-300'
                }`}
              >
                <Text className={`font-medium capitalize ${role === r ? 'text-white' : 'text-gray-700'}`}>
                  {r === 'worker' ? 'Worker' : 'Business'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="gap-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Full Name</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholder="Juan dela Cruz"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Phone (optional)</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholder="+639XXXXXXXXX"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholder="Min. 8 characters"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 mt-6 items-center"
            onPress={handleRegister}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">Already have an account? </Text>
            <Link href="/(auth)/login">
              <Text className="text-primary-600 font-semibold">Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
