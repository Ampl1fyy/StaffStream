/**
 * TrabaHost Payment Edge Function
 *
 * Handles payment initiation and webhook callbacks for:
 * - Maya (PayMaya): https://developers.maya.ph/
 * - GCash via PayMongo: https://developers.paymongo.com/
 *
 * Deploy: supabase functions deploy payment-webhook
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAYA_BASE_URL = Deno.env.get('MAYA_BASE_URL') ?? 'https://pg-sandbox.maya.ph';
const MAYA_SECRET_KEY = Deno.env.get('MAYA_SECRET_KEY') ?? '';
const PAYMONGO_SECRET_KEY = Deno.env.get('PAYMONGO_SECRET_KEY') ?? '';
const PLATFORM_FEE_RATE = 0.05;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const body = await req.json();
  const { action } = body;

  try {
    if (action === 'initiate') return await handleInitiate(body);
    if (action === 'status') return await handleStatus(body);
    if (action === 'webhook') return await handleWebhook(body, req);
    return json({ error: 'Unknown action' }, 400);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});

// ─────────────────────────────────────────
// Initiate Payment
// ─────────────────────────────────────────
async function handleInitiate(body: any) {
  const { applicationId, workerId, businessId, amount, method, workerWalletNumber, description } = body;

  const platformFee = parseFloat((amount * PLATFORM_FEE_RATE).toFixed(2));
  const netAmount = parseFloat((amount - platformFee).toFixed(2));

  // Create pending transaction
  const { data: txn, error: txnErr } = await supabase
    .from('transactions')
    .insert({
      application_id: applicationId,
      worker_id: workerId,
      business_id: businessId,
      amount,
      platform_fee: platformFee,
      net_amount: netAmount,
      payment_method: method,
      status: 'processing',
    })
    .select()
    .single();

  if (txnErr) throw new Error(txnErr.message);

  let paymentIntentId: string;
  let checkoutUrl: string | undefined;

  if (method === 'maya') {
    const result = await initiateMayaPayment({ amount: netAmount, description, walletNumber: workerWalletNumber, txnId: txn.id });
    paymentIntentId = result.paymentIntentId;
    checkoutUrl = result.checkoutUrl;
  } else {
    // GCash via PayMongo
    const result = await initiatePayMongoGCash({ amount: netAmount, description, txnId: txn.id });
    paymentIntentId = result.paymentIntentId;
    checkoutUrl = result.checkoutUrl;
  }

  await supabase.from('transactions').update({ payment_intent_id: paymentIntentId }).eq('id', txn.id);

  return json({ success: true, transactionId: txn.id, paymentIntentId, checkoutUrl });
}

// ─────────────────────────────────────────
// Maya Payment
// ─────────────────────────────────────────
async function initiateMayaPayment({ amount, description, walletNumber, txnId }: {
  amount: number; description: string; walletNumber: string; txnId: string;
}) {
  const auth = btoa(`${MAYA_SECRET_KEY}:`);

  const res = await fetch(`${MAYA_BASE_URL}/payby/v2/paymaya/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      totalAmount: { value: amount, currency: 'PHP' },
      redirectUrl: {
        success: `${Deno.env.get('APP_URL')}/payment-success`,
        failure: `${Deno.env.get('APP_URL')}/payment-failure`,
        cancel: `${Deno.env.get('APP_URL')}/payment-cancel`,
      },
      requestReferenceNumber: txnId,
      metadata: { description, walletNumber },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Maya payment failed');

  return { paymentIntentId: data.paymentId, checkoutUrl: data.redirectUrl };
}

// ─────────────────────────────────────────
// PayMongo GCash Payment
// ─────────────────────────────────────────
async function initiatePayMongoGCash({ amount, description, txnId }: {
  amount: number; description: string; txnId: string;
}) {
  const auth = btoa(`${PAYMONGO_SECRET_KEY}:`);

  // Create payment intent
  const intentRes = await fetch('https://api.paymongo.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100),  // in centavos
          payment_method_allowed: ['gcash'],
          currency: 'PHP',
          capture_type: 'automatic',
          description,
          metadata: { transaction_id: txnId },
        },
      },
    }),
  });

  const intentData = await intentRes.json();
  if (!intentRes.ok) throw new Error(intentData.errors?.[0]?.detail ?? 'PayMongo error');

  const paymentIntentId = intentData.data.id;

  // Attach GCash payment method
  const methodRes = await fetch('https://api.paymongo.com/v1/payment_methods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      data: { attributes: { type: 'gcash' } },
    }),
  });

  const methodData = await methodRes.json();
  const paymentMethodId = methodData.data.id;

  // Attach to intent
  const attachRes = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          payment_method: paymentMethodId,
          return_url: `${Deno.env.get('APP_URL')}/payment-callback`,
        },
      },
    }),
  });

  const attachData = await attachRes.json();
  const checkoutUrl = attachData.data?.attributes?.next_action?.redirect?.url;

  return { paymentIntentId, checkoutUrl };
}

// ─────────────────────────────────────────
// Check Status
// ─────────────────────────────────────────
async function handleStatus(body: any) {
  const { transactionId } = body;
  const { data: txn } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  return json({ status: txn?.status ?? 'unknown', reference: txn?.payment_reference });
}

// ─────────────────────────────────────────
// Webhook from Maya/PayMongo
// ─────────────────────────────────────────
async function handleWebhook(body: any, req: Request) {
  // Verify webhook signature (simplified — add HMAC verification in production)
  const txnId = body?.data?.attributes?.metadata?.transaction_id
    ?? body?.requestReferenceNumber;

  if (!txnId) return json({ received: true });

  const status = body?.data?.attributes?.status === 'paid' || body?.status === 'PAYMENT_SUCCESS'
    ? 'completed' : 'failed';
  const reference = body?.data?.attributes?.reference_number ?? body?.receiptNumber ?? '';

  await supabase.from('transactions').update({
    status,
    payment_reference: reference,
    completed_at: status === 'completed' ? new Date().toISOString() : null,
  }).eq('id', txnId);

  return json({ received: true });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
