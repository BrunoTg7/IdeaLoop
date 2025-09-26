import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

export function useAuth() {
  // Função para checar se já está autenticado
  const checkAuth = async () => {
    // Tenta pegar do cache primeiro
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: User & { cached_at?: string } = JSON.parse(raw);
      if (cached && cached.id) {
        return cached;
      }
    }
    // Se não tem cache, tenta pegar do supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        plan: 'free',
        usage_count: 0,
        usage_reset_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    }
    return null;
  };
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const CACHE_KEY = 'idealoop.auth.user.v1'
  const navigate = useNavigate()

  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('🚨 Emergency timeout - forcing loading to false')
      setLoading(false)
    }, 6000)
    return () => clearTimeout(timeout)
  }, [])

  // Hydrate from cache synchronamente para reduzir flash
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const cached: User & { cached_at?: string } = JSON.parse(raw)
        if (cached && cached.id) {
          setUser(cached)
          // Mantém loading true para revalidação, mas UI já pode exibir algo
          console.log('⚡ Hydrated user from cache:', cached.email)
        }
      }
    } catch (e) {
      console.warn('Cache hydration failed', e)
    }
  }, [])

  const createProfile = useCallback(async (authUser: SupabaseUser, shouldRedirect: boolean = true): Promise<boolean> => {
    console.log('🔧 Creating profile for:', authUser.email)

    try {
      const localUser: User = {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        plan: 'free',
        usage_count: 0,
        usage_reset_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      setUser(localUser)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ...localUser, cached_at: new Date().toISOString() }))
      } catch (e) {
        console.warn('Cache save failed (createProfile)', e)
      }

      if (shouldRedirect) {
        console.log('🚀 Redirecting to dashboard...')
        navigate('/dashboard')
      }

      return true
    } catch (error) {
      console.error('❌ Create profile error:', error)
      return false
    }
  }, [navigate])

  // Initialize / revalidate auth state (lazy refresh if cache existed)
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
  console.log('🔁 Initializing auth (server validation)...')

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user && mounted) {
          // Se já existe cache e mesmo id, apenas confirmar
          if (!user || user.id !== session.user.id) {
            console.log('📋 Session user differs from cache -> rebuild local profile')
            await createProfile(session.user, false)
          } else {
            console.log('✅ Cached user matches session, skipping rebuild')
          }
        } else {
          if (!session?.user) {
            setUser(null)
            localStorage.removeItem(CACHE_KEY)
          }
        }
      } catch (error) {
        console.error('❌ Auth init error:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('🔄 Auth event:', event)

      if (event === 'SIGNED_IN' && session?.user) {
        if (!user || user.id !== session.user.id) {
          console.log('👤 User signed in (event) - creating profile (not yet set)')
          await createProfile(session.user, true)
        } else {
          console.log('🔁 SIGNED_IN event received but user already synchronized - skipping')
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👤 User signed out')
        setUser(null)
  try { localStorage.removeItem(CACHE_KEY) } catch (e) { console.warn('Cache clear failed (sign out)', e) }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔐 Token refreshed')
        // atualizar cache silenciosamente
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...user, cached_at: new Date().toISOString() })) } catch (e) { console.warn('Cache refresh failed', e) }
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [createProfile, user])

  const signUp = async (email: string, password: string, name: string) => {
    console.log('🎧 Signing up...')
    setLoading(true)
    const t0 = performance.now()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })

    if (error) {
      setLoading(false)
      throw error
    }
    console.log('✅ Signup successful (raw)')

    if (data.session?.user) {
      console.log('⚡ Immediate session after signup - creating profile now')
      await createProfile(data.session.user, true)
    } else {
      console.log('✉️ Signup sem sessão (provável confirmação por email). Aguardando evento SIGNED_IN.')
    }
    setLoading(false)
    console.log('⏱ signup roundtrip ms:', Math.round(performance.now() - t0))
    return data
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Signing in...')
    setLoading(true)
    const t0 = performance.now()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setLoading(false)
      throw error
    }
    console.log('✅ Login successful (raw)')
    if (data.session?.user) {
      if (!user || user.id !== data.session.user.id) {
        console.log('⚡ Immediate session present - creating profile now (without waiting event)')
        await createProfile(data.session.user, true)
      } else {
        console.log('🔁 Session user already set locally, skipping duplicate createProfile')
      }
    }
    setLoading(false)
    console.log('⏱ signIn roundtrip ms:', Math.round(performance.now() - t0))
    return data
  }

  const signOut = async () => {
    console.log('🚪 Signing out...')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  try { localStorage.removeItem(CACHE_KEY) } catch (e) { console.warn('Cache clear failed (signOut fn)', e) }
    navigate('/')
    console.log('✅ Signed out')
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

    // Update local state
    const updated = { ...user, plan }
    setUser(updated)
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...updated, cached_at: new Date().toISOString() })) } catch (e) { console.warn('Cache save failed (update plan)', e) }
  }

  return { user, loading, signUp, signIn, signOut, updateUserPlan, checkAuth }
}