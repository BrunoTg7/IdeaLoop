export interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro' | 'unlimited'
  usage_count: number
  usage_reset_date: string
  created_at: string
}

export interface ContentGeneration {
  id: string
  user_id: string
  content: GeneratedContent
  created_at: string
}

export interface GeneratedContent {
  PLATAFORMA_ALVO_GERADA: string
  TITULO_PRINCIPAL: string
  TITULOS_ALTERNATIVOS: string[]
  DESCRICAO_LEGENDA: string
  HASHTAGS_TAGS: string[]
  ROTEIRO: string
  PONTOS_CHAVE_DO_VIDEO: string[]
  TAGS_YOUTUBE?: string[]
  PALAVRAS_CHAVE_SEO?: string[]
  TEXTO_THUMBNAIL?: string
  CTA_VARIANTES?: string[]
}

export interface GenerationRequest {
  TIPO_DE_ACAO?: "REGENERAR_VARIACAO" | "REFINAR_CAMPO" | "REFINAR_LOTE";
  CAMPO_ALVO?: string;
  CAMPOS_ALVO?: string[];
  INSTRUCAO?: string;
  CONTEUDO_EXISTENTE?: GeneratedContent;
  NOVA_INSTRUCAO?: string;
  PLATAFORMA_ALVO: string;
  TEMA_PRINCIPAL: string
  PALAVRAS_CHAVE_FOCO: string
  TOM_DE_VOZ: string
  DURACAO_ESTIMADA_VIDEO: string
  LINGUA_ALVO?: string // ex: 'pt-BR', 'en-US', 'es-ES'
  IMAGEM_BASE64?: string // Imagem em base64 para análise visual
}

export const PLAN_LIMITS = {
  free: { 
    generationsPerWeek: 2, 
    name: 'Starter (Grátis)', 
    price: 'R$ 0,00',
    hasRefinement: false
  },
  pro: { 
    generationsPerMonth: 50, 
    name: 'Pro', 
    price: 'R$ 50,00/mês',
    hasRefinement: true
  },
  unlimited: { 
    generationsPerMonth: Infinity, 
    name: 'Prime', 
    price: 'R$ 150,00/mês',
    hasRefinement: true,
    hasPriority: true
  }
}

export const PLATFORM_CONFIGS = {
  'YouTube': {
    titleMaxLength: 60,
    descriptionStyle: 'detailed',
    hashtagCount: 10,
    focusArea: 'SEO and detailed descriptions'
  },
  'TikTok': {
    titleMaxLength: 30,
    descriptionStyle: 'short_viral',
    hashtagCount: 7,
    focusArea: 'First 3 seconds hook'
  },
  'Instagram Reels': {
    titleMaxLength: 30,
    descriptionStyle: 'short_viral',
    hashtagCount: 7,
    focusArea: 'Visual hook and engagement'
  }
}