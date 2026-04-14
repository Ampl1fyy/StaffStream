/**
 * StaffStream Reliability Score Edge Function
 *
 * Recalculates a worker's reliability score after each completed shift.
 * Score is based on: on-time check-ins, shift completion rate, ratings.
 *
 * Deploy: supabase functions deploy reliability-score
 * Trigger via: Supabase DB Webhook on applications UPDATE (when status → completed)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const body = await req.json();
  const application = body.record;

  if (!application?.worker_id) return new Response('No worker_id', { status: 400 });

  try {
    await recalculateScore(application.worker_id);
    return new Response('OK', { status: 200 });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
});

async function recalculateScore(workerId: string) {
  const { data: apps } = await supabase
    .from('applications')
    .select('status, checked_in_at, shifts(time_start)')
    .eq('worker_id', workerId)
    .in('status', ['approved', 'withdrawn']);

  if (!apps || apps.length === 0) return;

  const approved = apps.filter((a) => a.status === 'approved');
  const withdrawn = apps.filter((a) => a.status === 'withdrawn');
  const total = approved.length + withdrawn.length;

  // Factor 1: Completion rate (0–1)
  const completionRate = total > 0 ? approved.length / total : 1;

  // Factor 2: On-time check-in rate
  const checkedIn = approved.filter((a) => a.checked_in_at);
  const onTimeRate = approved.length > 0
    ? checkedIn.filter((a) => {
        const scheduledStart = new Date((a.shifts as any)?.time_start ?? 0).getTime();
        const actualIn = new Date(a.checked_in_at!).getTime();
        return actualIn <= scheduledStart + 10 * 60 * 1000; // within 10 min
      }).length / approved.length
    : 1;

  // Factor 3: Average rating
  const { data: ratings } = await supabase
    .from('ratings')
    .select('score')
    .eq('rated_id', workerId);

  const avgRating = ratings && ratings.length > 0
    ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
    : 3.0;

  // Weighted score (out of 5)
  const reliabilityScore = parseFloat((
    completionRate * 2.0 +
    onTimeRate * 1.5 +
    (avgRating / 5) * 1.5
  ).toFixed(2));

  await supabase
    .from('profiles')
    .update({
      reliability_score: Math.min(5, reliabilityScore),
      average_rating: parseFloat(
        ((ratings ?? []).reduce((s, r) => s + r.score, 0) / Math.max(1, (ratings ?? []).length)).toFixed(2)
      ),
      total_ratings: (ratings ?? []).length,
    })
    .eq('id', workerId);
}
