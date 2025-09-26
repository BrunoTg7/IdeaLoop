import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('🚨 Emergency timeout - forcing loading to false')
      setLoading(false)
    }, 8000)
    return () => clearTimeout(timeout)
  }, [])

  const fetchUserProfile = useCallback(async (userId: string): Promise<boolean> => {
    console.log('🔍 Fetching profile for:', userId)
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ Profile not found (PGRST116)')
          return false
        }
        console.error('❌ Profile fetch error:', error)
        return false
      }

      if (data) {
        console.log('✅ Profile found:', data.email)
        setUser(data)
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Profile fetch exception:', error)
      return false
    }
  }, [])

  const createProfile = useCallback(async (authUser: SupabaseUser): Promise<boolean> => {
    console.log('🔧 Creating profile for:', authUser.email, 'ID:', authUser.id)
    
    try {
      const userData = {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        plan: 'free' as const,
        usage_count: 0,
        usage_reset_date: new Date().toISOString()
      }
      
      console.log('⚡ Creating user profile...')
      
      // Criar um usuário temporário local
      const tempUser: User = {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        plan: 'free',
        usage_count: 0,
        usage_reset_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
      
      console.log('✅ User profile created:', tempUser)
      setUser(tempUser)
      
      // Tentar inserir no background
      supabase
        .from('users')
        .insert(userData)
        .then(({ error }) => {
          if (error) {
            console.log('🔄 Background insert failed:', error.message)
            if (error.code === '23505') {
              console.log('✅ User already exists in database')
            }
          } else {
            console.log('✅ Background insert successful!')
          }
        })
      
      return true
    } catch (error) {
      console.error('❌ Create profile exception:', error)
      return false
    }
  }, [])

  // Inicialização - sempre começar sem usuário autenticado
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        console.log('🚀 Auth init - Starting fresh session')
        
        // Sempre limpar qualquer sessão existente ao inicializar
        console.log('🧹 Clearing any existing session...')
        await supabase.auth.signOut()
        
        console.log('✅ Session cleared - user will start at landing page')
        setUser(null)
      } catch (error) {
        console.error('❌ Init error:', error)
        if (mounted) setUser(null)
      } finally {
        if (mounted) {
          console.log('✅ Init complete')
          setLoading(false)
        }
      }
    }

    init()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('🔄 Auth event:', event, 'User:', session?.user?.email || 'none')
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        if (mounted) setLoading(false)
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('👤 Processing SIGNED_IN for:', session.user.email)
        try {
          const created = await createProfile(session.user)
          console.log('✅ Profile creation result:', created)
          
          if (!created && mounted) {
            const hasProfile = await fetchUserProfile(session.user.id)
            console.log('🔍 Has profile?', hasProfile)
          }
        } catch (error) {
          console.error('❌ Error in SIGNED_IN handler:', error)
        }
        
        if (mounted) setLoading(false)
      } else {
        if (mounted) setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile, createProfile])

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })

    if (error) throw error

    if (data.user && data.session) {
      await createProfile(data.user)
    }

    return data
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Signing in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    if (data.user && data.session) {
      console.log('✅ Login success:', data.user.email)
      setTimeout(async () => {
        const hasProfile = await fetchUserProfile(data.user.id)
        if (!hasProfile) {
          await createProfile(data.user)
        }
      }, 500)
    }

    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateUserPlan = async (plan: 'free' | 'pro' | 'unlimited') => {
    if (!user) throw new Error('User not authenticated')
    
    const { error } = await supabase
      .from('users')
      .update({ 
        plan,
        usage_count: 0,
        usage_reset_date: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error
    
    await fetchUserProfile(user.id)
  }

  return { user, loading, signUp, signIn, signOut, updateUserPlan }
}