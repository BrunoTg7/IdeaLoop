import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Absolute fallback - force loading to false after 2 seconds no matter what
  useEffect(() => {
    const absoluteTimeout = setTimeout(() => {
      console.log('🚨 ABSOLUTE TIMEOUT: Forcing loading to false')
      setLoading(false)
    }, 2000)

    return () => clearTimeout(absoluteTimeout)
  }, [])

  const fetchUserProfile = useCallback(async (userId: string): Promise<boolean> => {
    console.log('🔍 Fetching user profile for:', userId)
    
    try {
      // Create a promise that will timeout after 3 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 3000)
      })
      
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      console.log('📦 Query completed for user:', userId)

      if (error) {
        console.log('❌ Profile query error:', error.code, error.message)
        if (error.code === 'PGRST116') {
          console.log('❌ User profile not found in database (PGRST116)')
          return false
        }
        throw error
      }

      if (data) {
        console.log('✅ User profile found:', data.email)
        setUser(data)
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Exception in fetchUserProfile:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage === 'Query timeout') {
        console.error('❌ Database query timed out - continuing without profile')
      }
      return false
    }
  }, [])

  const createUserProfile = useCallback(async (authUser: SupabaseUser): Promise<boolean> => {
    try {
      console.log('🔧 Creating user profile for:', authUser.email, 'ID:', authUser.id)
      
      // Check if user is properly authenticated
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        console.error('❌ Cannot create profile: user not authenticated')
        return false
      }
      
      const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User'
      
      console.log('📝 Inserting profile data:', { id: authUser.id, email: authUser.email, name })
      const { error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email!,
          name,
          plan: 'free',
          usage_count: 0,
          usage_reset_date: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Error creating user profile:', error.message, error.code)
        if (error.code === '42501') {
          console.error('❌ RLS policy violation - user not properly authenticated')
        }
        return false
      }

      console.log('✅ User profile created successfully')
      return await fetchUserProfile(authUser.id)
    } catch (error) {
      console.error('❌ Exception in createUserProfile:', error)
      return false
    }
  }, [fetchUserProfile])

  useEffect(() => {
    let isMounted = true
    let authInitialized = false

    const initAuth = async () => {
      if (authInitialized) return
      authInitialized = true
      
      console.log('� Starting auth initialization...')
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.error('❌ Auth session error:', error)
          setUser(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('👤 Found active session for:', session.user.email)
          
          // Try to fetch profile, but don't block on it
          try {
            const profileExists = await fetchUserProfile(session.user.id)
            
            if (!profileExists && isMounted) {
              console.log('🔧 Profile not found, attempting to create...')
              try {
                await createUserProfile(session.user)
              } catch (createError) {
                console.error('❌ Failed to create profile, continuing anyway:', createError)
              }
            }
          } catch (profileError) {
            console.error('❌ Profile operations failed, continuing anyway:', profileError)
          }
        } else {
          console.log('❌ No active session')
          setUser(null)
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) {
          console.log('✅ Auth initialization complete, setting loading to false')
          setLoading(false)
        }
      }
    }

    // Initialize auth
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'no user')
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out')
        setUser(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔑 User signed in, ensuring profile exists...')
        try {
          const profileExists = await fetchUserProfile(session.user.id)
          if (!profileExists) {
            console.log('🔧 Creating missing profile for signed in user...')
            await createUserProfile(session.user)
          }
        } catch (error) {
          console.error('❌ Error handling SIGNED_IN event:', error)
        }
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile, createUserProfile])

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })

    if (error) throw error

    // If user was created and signed in immediately, ensure profile exists
    if (data.user && data.session) {
      await createUserProfile(data.user)
    }

    return data
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting to sign in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // If sign in successful, ensure user profile exists
    if (data.user && data.session) {
      console.log('✅ Sign in successful for:', data.user.email)
      
      // Give a small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 500))
      
      try {
        console.log('🔍 Checking if profile exists...')
        const profileExists = await fetchUserProfile(data.user.id)
        
        if (!profileExists) {
          console.log('🔧 Profile not found after login, creating profile...')
          const created = await createUserProfile(data.user)
          
          if (!created) {
            console.error('❌ Failed to create profile, but login was successful')
          }
        } else {
          console.log('✅ User profile already exists')
        }
      } catch (profileError) {
        console.error('❌ Error handling profile after login:', profileError)
        // Don't throw here - user is successfully authenticated
      }
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
    
    // Refresh user data
    await fetchUserProfile(user.id)
  }
  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateUserPlan
  }
}