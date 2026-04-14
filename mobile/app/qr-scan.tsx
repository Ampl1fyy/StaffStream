import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function QRScanScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-700 text-center mb-4">Camera permission is required to scan QR codes.</Text>
        <TouchableOpacity className="bg-primary-600 px-6 py-3 rounded-xl" onPress={requestPermission}>
          <Text className="text-white font-medium">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || !profile) return;
    setScanned(true);

    // data = shift QR token
    const { data: app, error } = await supabase
      .from('applications')
      .select('*, shifts!inner(*)')
      .eq('worker_id', profile.id)
      .eq('shifts.qr_code', data)
      .eq('status', 'approved')
      .maybeSingle();

    if (error || !app) {
      Alert.alert('Invalid QR', 'No approved application found for this shift.', [
        { text: 'Try Again', onPress: () => setScanned(false) },
        { text: 'Cancel', onPress: () => router.back() },
      ]);
      return;
    }

    const now = new Date().toISOString();
    const isCheckIn = !app.checked_in_at;

    await supabase
      .from('applications')
      .update(
        isCheckIn
          ? { checked_in_at: now }
          : { checked_out_at: now }
      )
      .eq('id', app.id);

    Alert.alert(
      isCheckIn ? 'Checked In!' : 'Checked Out!',
      isCheckIn
        ? `You have successfully checked in. Good luck!`
        : `Shift complete! Your payment will be processed shortly.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }

  return (
    <View className="flex-1">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay */}
      <View className="flex-1 items-center justify-center">
        <View className="w-64 h-64 border-2 border-white rounded-2xl" />
        <Text className="text-white text-base mt-6 font-medium">
          {scanned ? 'Processing...' : 'Scan the QR code at the business'}
        </Text>
      </View>

      <TouchableOpacity
        className="absolute top-14 left-5 bg-black/40 rounded-full px-4 py-2"
        onPress={() => router.back()}
      >
        <Text className="text-white font-medium">✕ Close</Text>
      </TouchableOpacity>
    </View>
  );
}
