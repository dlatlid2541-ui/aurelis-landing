import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function assertSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase 설정이 필요합니다. .env 파일에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 추가해 주세요.'
    );
  }
  return supabase;
}
