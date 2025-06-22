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
          run_id: string
          tavus_job_id: string | null
          status: string
          video_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          run_id: string
          tavus_job_id?: string | null
          status?: string
          video_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          run_id?: string
          tavus_job_id?: string | null
          status?: string
          video_url?: string | null
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