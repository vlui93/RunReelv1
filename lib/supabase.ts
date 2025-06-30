import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// For demo purposes - replace with your actual Supabase credentials
if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
  console.warn('🔧 Demo Mode: Using placeholder Supabase configuration. Replace with your actual credentials in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);