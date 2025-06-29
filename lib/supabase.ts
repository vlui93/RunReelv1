import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export const refreshSupabaseSchema = async () => {
  try {
    console.log('🔄 Refreshing Supabase schema cache...');
    
    // Method 1: Use the notify function to reload PostgREST schema cache
    const { data, error } = await supabase
      .rpc('notify_pgrst_reload');
    
    if (error) {
      console.warn('Schema refresh notification failed:', error.message);
      // Continue with alternative method
    } else {
      console.log('✅ Schema refresh notification sent');
    }
    
    // Method 2: Test the schema by querying the problematic table
    console.log('🔍 Verifying schema with test query...');
    const { data: testData, error: testError } = await supabase
      .from('video_generations')
      .select('id, generation_config')
      .limit(1);
    
    if (testError) {
      if (testError.code === 'PGRST204') {
        console.error('❌ Schema cache still out of sync:', testError.message);
        console.log('💡 Try running: node scripts/refresh-schema.js');
        return false;
      }
      console.warn('Schema test query failed:', testError.message);
      return false;
    }
    
    console.log('✅ Schema cache is synchronized');
    return true;
  } catch (error) {
    console.error('Schema refresh failed:', error);
    return false;
  }
}

// Alternative method using direct SQL execution
export const forceSchemaReload = async () => {
  try {
    console.log('🔧 Force reloading schema cache...');
    
    // Try multiple methods to force schema reload
    const methods = [
      () => supabase.rpc('notify_pgrst_reload'),
      () => supabase.rpc('check_column_exists', { table_name: 'video_generations', column_name: 'generation_config' })
    ];
    
    for (const method of methods) {
      try {
        await method();
        console.log('✅ Schema reload method succeeded');
      } catch (err) {
        console.warn('Schema reload method failed:', err);
      }
    }
    
    return await refreshSupabaseSchema();
  } catch (error) {
    console.error('Force schema reload failed:', error);
}

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      runs: {
        Row: {
          id: string
          user_id: string
          distance: number
          duration: number
          average_pace: number | null
          calories: number | null
          route_data: any | null
          video_url: string | null
          effort_level: string | null
          mood_rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          distance: number
          duration: number
          average_pace?: number | null
          calories?: number | null
          route_data?: any | null
          video_url?: string | null
          effort_level?: string | null
          mood_rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          distance?: number
          duration?: number
          average_pace?: number | null
          calories?: number | null
          route_data?: any | null
          video_url?: string | null
          effort_level?: string | null
          mood_rating?: number | null
          created_at?: string
        }
      }
      video_generations: {
        Row: {
          id: string
          user_id: string
          run_id: string | null
          achievement_id: string | null
          tavus_job_id: string | null
          status: string
          video_url: string | null
          video_format: string | null
          template_id: string | null
          generation_config: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          run_id?: string | null
          achievement_id?: string | null
          tavus_job_id?: string | null
          status?: string
          video_url?: string | null
          video_format?: string | null
          template_id?: string | null
          generation_config?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          run_id?: string | null
          achievement_id?: string | null
          tavus_job_id?: string | null
          status?: string
          video_url?: string | null
          video_format?: string | null
          template_id?: string | null
          generation_config?: any | null
          created_at?: string
        }
      }
      video_analytics: {
        Row: {
          id: string
          video_generation_id: string
          user_id: string
          event_type: string
          platform: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          video_generation_id: string
          user_id: string
          event_type: string
          platform?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          video_generation_id?: string
          user_id?: string
          event_type?: string
          platform?: string | null
          metadata?: any
          created_at?: string
        }
      }
      video_likes: {
        Row: {
          id: string
          video_generation_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          video_generation_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          video_generation_id?: string
          user_id?: string
          created_at?: string
        }
      }
      video_comments: {
        Row: {
          id: string
          video_generation_id: string
          user_id: string
          comment_text: string
          created_at: string
        }
        Insert: {
          id?: string
          video_generation_id: string
          user_id: string
          comment_text: string
          created_at?: string
        }
        Update: {
          id?: string
          video_generation_id?: string
          user_id?: string
          comment_text?: string
          created_at?: string
        }
      }
    }
  }
}