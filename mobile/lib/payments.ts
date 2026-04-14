/**
 * StaffStream Payment Service
 *
 * Maya (primary): https://developers.maya.ph/
 * GCash via PayMongo: https://developers.paymongo.com/
 *
 * All payment flows go through Supabase Edge Function "payment-webhook"
 * to keep secret keys server-side only.
 */

import { supabase } from './supabase';
import type { PaymentMethod } from '../types';

export interface InitiatePaymentParams {
  applicationId: string;
  workerId: string;
  businessId: string;
  amount: number;            // in PHP
  method: PaymentMethod;
  workerWalletNumber: string;
  description: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentIntentId?: string;
  checkoutUrl?: string;   // redirect user here for Maya checkout
  error?: string;
}

export async function initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult> {
  const { data, error } = await supabase.functions.invoke('payment-webhook', {
    body: { action: 'initiate', ...params },
  });

  if (error) return { success: false, error: error.message };
  return data as PaymentResult;
}

export async function checkPaymentStatus(transactionId: string): Promise<{
  status: string;
  reference?: string;
}> {
  const { data, error } = await supabase.functions.invoke('payment-webhook', {
    body: { action: 'status', transactionId },
  });

  if (error) return { status: 'unknown' };
  return data;
}

export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

export function computeWages(hourlyRate: number, hoursWorked: number): {
  gross: number;
  platformFee: number;
  net: number;
} {
  const gross = hourlyRate * hoursWorked;
  const platformFee = parseFloat((gross * 0.05).toFixed(2));  // 5% fee
  const net = parseFloat((gross - platformFee).toFixed(2));
  return { gross, platformFee, net };
}
