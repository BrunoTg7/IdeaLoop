import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AIService } from '../services/aiService'
import { useAuth } from './useAuth'
import type { GenerationRequest, GeneratedContent } from '../types'

export function useContentGeneration() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkUsageLimit = async (): Promise<boolean> => {
    if (!user) return false

    const { data, error } = await supabase.rpc('check_usage_limit', {
      user_uuid: user.id
    })

    if (error) {
      console.error('Error checking usage limit:', error)
      return false
    }

    return data
  }

  const generateContent = async (request: GenerationRequest): Promise<GeneratedContent | null> => {
    if (!user) {
      setError('User not authenticated')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Check usage limit for new generations
      if (request.TIPO_DE_ACAO === 'NOVO') {
        const canGenerate = await checkUsageLimit()
        if (!canGenerate) {
          throw new Error('Usage limit exceeded. Please upgrade your plan.')
        }
      }

      // Check if user has access to refinement features
      if (request.TIPO_DE_ACAO !== 'NOVO' && user.plan === 'free') {
        throw new Error('Content refinement is only available for Pro and Prime plans.')
      }

      // Generate content using AI service
      const content = await AIService.generateContent(request)

      // Save to database
      const { error: saveError } = await supabase
        .from('content_generations')
        .insert({
          user_id: user.id,
          platform: request.PLATAFORMA_ALVO,
          theme: request.TEMA_PRINCIPAL,
          keywords: request.PALAVRAS_CHAVE_FOCO,
          tone: request.TOM_DE_VOZ,
          duration: request.DURACAO_ESTIMADA_VIDEO,
          content,
          generation_type: request.TIPO_DE_ACAO,
          refinement_instruction: request.NOVA_INSTRUCAO || null
        })

      if (saveError) {
        console.error('Error saving content:', saveError)
        // Don't throw error here, content was generated successfully
      }

      return content
    } catch (err: any) {
      setError(err.message || 'Failed to generate content')
      return null
    } finally {
      setLoading(false)
    }
  }

  const getUserGenerations = async (limit = 10) => {
    if (!user) return []

    const { data, error } = await supabase
      .from('content_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching generations:', error)
      return []
    }

    return data
  }

  const getUserUsageStats = async () => {
    if (!user) return null

    const { data, error } = await supabase.rpc('get_user_usage_stats', {
      user_uuid: user.id
    })

    if (error) {
      console.error('Error fetching usage stats:', error)
      return null
    }

    return data[0] || null
  }

  return {
    loading,
    error,
    generateContent,
    getUserGenerations,
    getUserUsageStats,
    checkUsageLimit
  }
}