/**
 * TrabaHost Matching Engine Edge Function
 *
 * Triggered after a shift is created.
 * Finds eligible workers within radius and sends push notifications.
 *
 * Deploy: supabase functions deploy matching-engine
 * Trigger via: Supabase Database Webhook on shifts INSERT
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') ?? '';
const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL') ?? '';
const FIREBASE_PRIVATE_KEY = normalizePrivateKey(Deno.env.get('FIREBASE_PRIVATE_KEY') ?? '');
const MATCH_RADIUS_METERS = 5000;

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error(
    'Missing Firebase service account env variables. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
  );
}

serve(async (req) => {
  const body = await req.json();

  // Supabase DB webhook payload
  const shift = body.record;
  if (!shift) return new Response('No shift in payload', { status: 400 });

  try {
    await notifyNearbyWorkers(shift);
    return new Response('OK', { status: 200 });
  } catch (e: any) {
    console.error('Matching engine error:', e.message);
    return new Response(e.message, { status: 500 });
  }
});

async function notifyNearbyWorkers(shift: any) {
  // Get workers within radius who have a FCM token
  const { data: workers } = await supabase.rpc('get_nearby_workers', {
    shift_lat: shift.location?.coordinates?.[1] ?? 0,
    shift_lng: shift.location?.coordinates?.[0] ?? 0,
    radius_meters: MATCH_RADIUS_METERS,
    required_skill_id: shift.skill_id,
  });

  if (!workers || workers.length === 0) return;

  const tokens: string[] = workers
    .filter((w: any) => w.fcm_token)
    .map((w: any) => w.fcm_token);

  if (tokens.length === 0) return;

  // Log notifications in DB
  await supabase.from('notifications').insert(
    workers.map((w: any) => ({
      user_id: w.id,
      title: 'New shift near you!',
      body: `${shift.title} — ₱${shift.hourly_rate}/hr at ${shift.address}`,
      data: { shift_id: shift.id, type: 'new_shift' },
    }))
  );

  const messagePayload = {
    title: 'New shift near you!',
    body: `${shift.title} — ₱${shift.hourly_rate}/hr at ${shift.address}`,
    data: { shift_id: shift.id },
  };

  const accessToken = await getFirebaseAccessToken();
  for (let i = 0; i < tokens.length; i += 50) {
    const batch = tokens.slice(i, i + 50);
    await Promise.all(batch.map((token) =>
      sendFCMNotification({ token, accessToken, ...messagePayload })
    ));
  }
}

async function sendFCMNotification({
  token, title, body, data, accessToken,
}: {
  token: string;
  title: string;
  body: string;
  data: Record<string, string>;
  accessToken: string;
}) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          android: {
            priority: 'HIGH',
            notification: { sound: 'default' },
          },
          data,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('FCM error:', err);
  }
}

async function getFirebaseAccessToken(): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp,
  };

  const assertion = await createJwt(header, payload, FIREBASE_PRIVATE_KEY);
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`Firebase auth failed: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

function normalizePrivateKey(key: string) {
  return key.replace(/\\n/g, '\n').trim();
}

function base64UrlEncode(value: Uint8Array) {
  let str = '';
  for (const byte of value) {
    str += String.fromCharCode(byte);
  }
  const base64 = btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return base64;
}

function jsonBase64(value: unknown) {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

function pemToArrayBuffer(pem: string) {
  const cleaned = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function createJwt(header: object, payload: object, privateKeyPem: string) {
  const signingInput = `${jsonBase64(header)}.${jsonBase64(payload)}`;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      privateKey,
      new TextEncoder().encode(signingInput)
    )
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
}
