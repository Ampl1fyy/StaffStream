import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

// Admin client uses service role key — bypasses RLS
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
