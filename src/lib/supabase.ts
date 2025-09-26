import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          plan: 'free' | 'pro' | 'unlimited'
          usage_count: number
          usage_reset_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          plan?: 'free' | 'pro' | 'unlimited'
          usage_count?: number
          usage_reset_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          plan?: 'free' | 'pro' | 'unlimited'
          usage_count?: number
          usage_reset_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      content_generations: {
        Row: {
          id: string
          user_id: string
          platform: string
          theme: string
          keywords: string | null
          tone: string | null
          duration: string | null
          content: any
          generation_type: string
          refinement_instruction: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          theme: string
          keywords?: string | null
          tone?: string | null
          duration?: string | null
          content: any
          generation_type?: string
          refinement_instruction?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          theme?: string
          keywords?: string | null
          tone?: string | null
          duration?: string | null
          content?: any
          generation_type?: string
          refinement_instruction?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      check_usage_limit: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      get_user_usage_stats: {
        Args: { user_uuid: string }
        Returns: {
          current_usage: number
          usage_limit: number
          days_until_reset: number
          can_generate: boolean
        }[]
      }
    }
  }
}