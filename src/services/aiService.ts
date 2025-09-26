import type { GeneratedContent, GenerationRequest } from '../types'

interface GeminiRequestBody {
  apiKey: string
  prompt: string
  imageBase64?: string
}

export class AIService {
  private static readonly PROXY_URL = 'http://localhost:3001/api/gemini'

  private static readonly SYSTEM_PROMPT = 'Você é um especialista em marketing digital e criação de conteúdo viral para YouTube, TikTok e Instagram, com foco em EXTRAIR SINAIS VISUAIS da imagem quando fornecida.\n\n' +
    'IMPORTANTE: Responda APENAS com JSON válido. Comece diretamente com { e termine com }.\n\n' +
  'SE HOUVER UMA IMAGEM ANEXADA (VISUAL BRANDING):\n' +
  '- Liste mentalmente (não escreva) elementos visuais centrais (ex: cores dominantes, objetos, contexto, emoções)\n' +
  '- Integre 1 desses elementos no TITULO_PRINCIPAL de forma NATURAL (sem citar "imagem" ou "foto")\n' +
  '- Se a imagem reforça um BENEFÍCIO (ex: alguém sorrindo, gráfico subindo), reflita isso no gancho\n' +
  '- NÃO invente elementos que não estejam claramente na imagem\n\n' +
    'ESTRUTURA JSON OBRIGATÓRIA:\n' +
    '{\n' +
    '  "PLATAFORMA_ALVO_GERADA": "YouTube|TikTok|Instagram Reels",\n' +
    '  "TITULO_PRINCIPAL": "título otimizado para a plataforma",\n' +
    '  "TITULOS_ALTERNATIVOS": ["título 2", "título 3"],\n' +
    '  "DESCRICAO_LEGENDA": "descrição completa com gancho e CTA",\n' +
    '  "HASHTAGS_TAGS": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],\n' +
    '  "ROTEIRO": "roteiro em markdown com GANCHO, CORPO, ENCERRAMENTO",\n' +
  '  "PONTOS_CHAVE_DO_VIDEO": ["ponto 1", "ponto 2", "ponto 3"],\n' +
  '  "TAGS_YOUTUBE"?: ["tag1", "tag2"],\n' +
  '  "PALAVRAS_CHAVE_SEO"?: ["keyword primária", "keyword secundária"],\n' +
  '  "TEXTO_THUMBNAIL"?: "2-4 palavras de alto impacto (YouTube)",\n' +
  '  "CTA_VARIANTES"?: ["Chamada 1", "Chamada 2"]\n' +
    '}\n\n' +
  'DIRETRIZES PARA TÍTULOS:\n' +
  '- PROIBIDO usar: "em 60 segundos", "60s", "em 30s", "guia completo" em conteúdos curtos (<= 30s)\n' +
  '- TITULO_PRINCIPAL: CRIATIVO + BENEFÍCIO CLARO + (se imagem) 1 elemento visual sutil\n' +
  '- NUNCA repetir exatamente o TEMA_PRINCIPAL isolado como título\n' +
  '- Evitar redundâncias (ex: repetir "saúde financeira" 2x no mesmo título)\n' +
  '- Alternativos: cada um deve usar ESTRUTURA diferente (pergunta, urgência, número, curiosidade, desconstrução)\n' +
  '- Permitido usar 1 emoji no principal e até 1 em cada alternativo (opcional)\n\n' +
    'DIRETRIZES GERAIS:\n' +
    '- YouTube: títulos até 60 chars, descrições longas com SEO, 8-10 hashtags\n' +
    '- TikTok/Instagram: títulos curtos até 30 chars, foco nos primeiros 3s, 5-7 hashtags virais\n' +
    '- Hashtags: pesquisar mentalmente hashtags relevantes, populares e de tendência do nicho\n' +
    '- Roteiro: estruturado com gancho forte, desenvolvimento e CTA\n\n' +
    'IMPORTANTE: Responda apenas com o JSON acima, nada mais.'

  static async generateContent(request: GenerationRequest): Promise<GeneratedContent> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada. Adicione VITE_GEMINI_API_KEY ao seu arquivo .env')
    }

    try {
      const prompt = this.buildPrompt(request)

      const requestBody: GeminiRequestBody = {
        apiKey,
        prompt
      }

      if (request.IMAGEM_BASE64) {
        requestBody.imageBase64 = request.IMAGEM_BASE64
      }

      const response = await fetch(this.PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error('Erro no proxy da API do Gemini: ' + response.status + ' ' + response.statusText + ' - ' + errorText)
      }

      const data = await response.json()

      if (data.error) {
        console.error('Gemini API returned an error:', data.error)
        throw new Error('Erro na API do Gemini: ' + (data.error.message || 'Erro desconhecido'))
      }

      if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        console.error('Resposta inválida da API do Gemini - candidates array missing or empty:', data)
        throw new Error('Resposta inválida da API do Gemini: candidates array ausente ou vazio')
      }

      if (!data.candidates[0] || !data.candidates[0].content) {
        console.error('Resposta inválida da API do Gemini - content missing:', data)
        throw new Error('Resposta inválida da API do Gemini: content ausente')
      }

      if (!data.candidates[0].content.parts || !Array.isArray(data.candidates[0].content.parts) || data.candidates[0].content.parts.length === 0) {
        console.error('Resposta inválida da API do Gemini - parts array missing or empty:', data)
        throw new Error('Resposta inválida da API do Gemini: parts array ausente ou vazio')
      }

      const generatedText = data.candidates[0].content.parts[0].text

      try {
        let cleanText = generatedText.trim()

        if (cleanText.startsWith('`json')) {
          cleanText = cleanText.replace(/^`json\s*/, '').replace(/\s*`$/, '')
        } else if (cleanText.startsWith('`')) {
          cleanText = cleanText.replace(/^`\w*\s*/, '').replace(/\s*`$/, '')
        }

        cleanText = cleanText.trim()
  const result = JSON.parse(cleanText) as GeneratedContent
  const sanitized = this.postProcess(result, request)
  return sanitized
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON gerado:', parseError)
        console.error('Texto gerado:', generatedText)

        console.log('Usando fallback devido a erro de parsing')
        return this.createFallbackContent(request)
      }

    } catch (error) {
      console.error('Erro na geração de conteúdo:', error)
      throw error
    }
  }

  private static createFallbackContent(request: GenerationRequest): GeneratedContent {
    const durationSeconds = this.parseDurationToSeconds(request.DURACAO_ESTIMADA_VIDEO)
    const isShortForm = durationSeconds > 0 && durationSeconds <= 35
    const baseTopic = request.TEMA_PRINCIPAL.toLowerCase()
    const isYouTube = request.PLATAFORMA_ALVO === 'YouTube'
    const isTikTok = request.PLATAFORMA_ALVO === 'TikTok'
    const isInstagram = request.PLATAFORMA_ALVO === 'Instagram Reels'

    const hashtags = this.generateSmartHashtags(baseTopic)

    let tituloPrincipal = 'Como ' + request.TEMA_PRINCIPAL + ' na prática'
    if (isTikTok || isInstagram) {
      // títulos curtos sem padrão "60 segundos"
      tituloPrincipal = request.TEMA_PRINCIPAL.length > 24 ? request.TEMA_PRINCIPAL.slice(0, 22) + ' 🔥' : request.TEMA_PRINCIPAL + ' 🔥'
    } else if (isYouTube) {
      tituloPrincipal = 'Domine ' + request.TEMA_PRINCIPAL + ' (Passo a Passo)'
    }

    // Short-form fallback simplificado
    if ((isTikTok || isInstagram) && isShortForm) {
      const maxSeg = durationSeconds || 15
      const hook = 'Hook rápido sobre ' + request.TEMA_PRINCIPAL
      const valor = 'Insight principal ou mini dica prática'
      const cta = 'CTA curto: segue para mais'
      return {
        PLATAFORMA_ALVO_GERADA: request.PLATAFORMA_ALVO,
        TITULO_PRINCIPAL: tituloPrincipal,
        TITULOS_ALTERNATIVOS: [
          'Dica sobre ' + request.TEMA_PRINCIPAL,
          'Pare de errar em ' + request.TEMA_PRINCIPAL
        ],
        DESCRICAO_LEGENDA: hook + ' — ' + valor + '. ' + cta + '\n' + hashtags.slice(0, 5).join(' '),
        HASHTAGS_TAGS: hashtags.slice(0, 6),
        ROTEIRO: '* Hook (0-3s): ' + hook + '\n' +
          '* Valor (' + (maxSeg > 8 ? '3-' + Math.max(5, maxSeg - 4) + 's' : 'meio') + '): ' + valor + '\n' +
          '* CTA (últimos 2s): ' + cta,
        PONTOS_CHAVE_DO_VIDEO: [
          'Hook forte inicial',
          '1 ideia central clara',
          'CTA explícito no final'
        ]
      }
    }

    return {
      PLATAFORMA_ALVO_GERADA: request.PLATAFORMA_ALVO,
      TITULO_PRINCIPAL: tituloPrincipal,
      TITULOS_ALTERNATIVOS: [
        'Erro que destrói ' + request.TEMA_PRINCIPAL,
        '3 passos para ' + request.TEMA_PRINCIPAL
      ],
      DESCRICAO_LEGENDA: '🔥 ' + request.TEMA_PRINCIPAL + ' EXPLICADO de forma SIMPLES e DIRETA! Se você quer aprender ' + baseTopic + ' do zero, este vídeo é OBRIGATÓRIO!\n\n' +
        '⏰ TIMESTAMPS:\n' +
        '0:00 - Introdução\n' +
        '2:30 - Conceitos Básicos\n' +
        '5:45 - Estratégias Práticas\n' +
        '10:20 - Erros Comuns (EVITE!)\n' +
        '15:00 - Dicas Avançadas\n' +
        '20:00 - Conclusão\n\n' +
        '💰 RECURSOS MENCIONADOS:\n' +
        '• [Link para material gratuito]\n' +
        '• [Link para curso completo]\n' +
        '• [Link para comunidade]\n\n' +
        '📈 O que você vai aprender:\n' +
        '✅ Conceitos fundamentais\n' +
        '✅ Estratégias comprovadas\n' +
        '✅ Estudos de caso reais\n' +
        '✅ Dicas de especialistas\n' +
        '✅ Planilha de acompanhamento\n\n' +
        '🚀 Não esqueça de:\n' +
        '👍 CURTIR o vídeo\n' +
        '🔔 ATIVAR as notificações\n' +
        '💬 COMENTAR suas dúvidas\n' +
        '�� SE INSCREVER no canal\n\n' +
        hashtags.slice(0, 5).join(' ') + '\n\n' +
        '⚠️ DISCLAIMER: Este vídeo é apenas informativo. Consulte profissionais qualificados.',
      HASHTAGS_TAGS: hashtags,
      ROTEIRO: '# ' + request.TEMA_PRINCIPAL + ' - Guia Completo\n\n' +
        '## Introdução (0:00 - 2:30)\n' +
        'Olá pessoal! Bem-vindos ao canal! Hoje vamos falar sobre ' + request.TEMA_PRINCIPAL + ' - um tema que mudou completamente minha visão sobre sucesso.\n\n' +
        'Se você está começando agora ou já tem experiência, este vídeo vai te dar insights valiosos e práticos.\n\n' +
        '## Conceitos Básicos (2:30 - 5:45)\n' +
        'Antes de tudo, vamos entender o que é ' + request.TEMA_PRINCIPAL + ' e por que isso é importante.\n\n' +
        '### O que é ' + request.TEMA_PRINCIPAL + '?\n' +
        request.TEMA_PRINCIPAL + ' representa uma oportunidade de crescimento através do conhecimento e estratégia.\n\n' +
        '## Estratégias Práticas (5:45 - 10:20)\n' +
        'Agora vamos para a prática! Vou mostrar estratégias testadas e aprovadas.\n\n' +
        '## Erros Comuns (10:20 - 15:00)\n' +
        '⚠️ EVITE estes erros comuns:\n\n' +
        '• Agir sem conhecimento\n' +
        '• Seguir modas passageiras\n' +
        '• Desistir no primeiro obstáculo\n\n' +
        '## Dicas Avançadas (15:00 - 20:00)\n' +
        'Para quem quer ir além do básico...\n\n' +
        '## Conclusão (20:00 - 22:00)\n' +
        request.TEMA_PRINCIPAL + ' pode ser sua porta de entrada para o sucesso. Lembre-se: consistência é fundamental!\n\n' +
        'Obrigado por assistir! Curtiu o vídeo? Deixe seu like, compartilhe com os amigos e se inscreva para mais conteúdos.\n\n' +
        'Até a próxima!',
      PONTOS_CHAVE_DO_VIDEO: [
        'Introdução completa sobre ' + request.TEMA_PRINCIPAL,
        'Conceitos fundamentais explicados',
        'Estratégias práticas demonstradas',
        'Erros comuns e como evitá-los',
        'Dicas avançadas para profissionais',
        'Conclusão com call-to-action'
      ],
      TAGS_YOUTUBE: request.PLATAFORMA_ALVO === 'YouTube' ? [
        'tutorial', 'guia', 'iniciante', 'passo a passo', 'dicas', 'estratégia', 'erro comum', 'atualizado'
      ] : undefined,
      PALAVRAS_CHAVE_SEO: request.PLATAFORMA_ALVO === 'YouTube' ? [
        request.TEMA_PRINCIPAL.toLowerCase(),
        request.TEMA_PRINCIPAL.toLowerCase() + ' dicas',
        request.TEMA_PRINCIPAL.toLowerCase() + ' 2025'
      ] : undefined,
      TEXTO_THUMBNAIL: request.PLATAFORMA_ALVO === 'YouTube' ? 'FOCO TOTAL' : undefined,
      CTA_VARIANTES: [
        'Comenta se fez sentido',
        'Salva para rever depois'
      ]
    }
  }

  private static generateSmartHashtags(baseTopic: string): string[] {
    const topicLower = baseTopic.toLowerCase()

    // Tratamento prioritário para nichos compostos que estavam caindo em categorias genéricas
    // Saúde Financeira / Finanças Pessoais / Educação Financeira
    if (/(saúde\s+financeira|saude\s+financeira|finanças\s+pessoais|financas\s+pessoais|educação\s+financeira|educacao\s+financeira|finanças|financas)/.test(topicLower)) {
      const financeSet = [
        '#saudefinanceira',
        '#saúdefinanceira', // com acento alternativo
        '#finanças',
        '#financas',
        '#financaspessoais',
        '#educacaofinanceira',
        '#liberdadefinanceira',
        '#planejamentofinanceiro',
        '#dinheiro',
        '#investimentos',
        '#rendapassiva',
        '#organizacaofinanceira'
      ]
      // Limitar para 8-10 mantendo relevância
      return financeSet.slice(0, 9)
    }

    const themeHashtags: { [key: string]: string[] } = {
      'investimentos': ['#investimentos', '#ações', '#bolsa', '#mercadofinanceiro', '#rendavariavel', '#educacaofinanceira', '#bolsadevalores', '#corretora', '#dividendos'],
      'empreendedorismo': ['#empreendedorismo', '#negócios', '#startup', '#empreendedor', '#sucesso', '#motivação', '#inovação', '#empreender', '#negociolucrativo'],
      'tecnologia': ['#tecnologia', '#inovação', '#ia', '#inteligenciaartificial', '#blockchain', '#metaverso', '#futuro', '#tech', '#digital'],
      'marketing': ['#marketing', '#marketingdigital', '#vendas', '#publicidade', '#redessociais', '#conteudo', '#branding', '#growth', '#estrategia'],
      'saúde': ['#saúde', '#bemestar', '#fitness', '#nutrição', '#vidasaudavel', '#exercicio', '#dieta', '#mentalidade', '#autocuidado'],
      'educação': ['#educação', '#aprendizado', '#conhecimento', '#estudo', '#desenvolvimento', '#crescimento', '#aprendizagem', '#ensinamento', '#formação']
    }

    for (const [theme, hashtags] of Object.entries(themeHashtags)) {
      if (topicLower.includes(theme)) {
        return hashtags
      }
    }

    const words = topicLower.split(/\s+/)
    const genericHashtags = [
      '#' + words[0],
      '#' + words.slice(0, 2).join(''),
      '#aprendizado',
      '#conhecimento',
      '#dicas',
      '#sucesso',
      '#2025',
      '#brasil'
    ].filter(h => h.length > 1)

    return genericHashtags.slice(0, 9)
  }

  private static buildPrompt(request: GenerationRequest): string {
    let prompt = this.SYSTEM_PROMPT + '\n\n'

    prompt += 'ENTRADA_DO_USUARIO:\n'
    prompt += 'TIPO_DE_ACAO: "' + request.TIPO_DE_ACAO + '"\n'
    prompt += 'PLATAFORMA_ALVO: "' + request.PLATAFORMA_ALVO + '"\n'
    prompt += 'TEMA_PRINCIPAL: "' + request.TEMA_PRINCIPAL + '"\n'
    prompt += 'PALAVRAS_CHAVE_FOCO: "' + request.PALAVRAS_CHAVE_FOCO + '"\n'
    prompt += 'TOM_DE_VOZ: "' + request.TOM_DE_VOZ + '"\n'
    prompt += 'DURACAO_ESTIMADA_VIDEO: "' + request.DURACAO_ESTIMADA_VIDEO + '"\n'
    if (request.LINGUA_ALVO && request.LINGUA_ALVO !== 'pt-BR') {
      prompt += 'LINGUA_ALVO: "' + request.LINGUA_ALVO + '"\n'
      prompt += 'INSTRUCAO_IDIOMA: Produzir TODO o conteúdo textual (títulos, descrição, roteiro, CTA) em ' + request.LINGUA_ALVO + ' mantendo nomes próprios/termos de marca no idioma original quando apropriado. Não misturar idiomas.\n'
    } else {
      prompt += 'LINGUA_ALVO: "pt-BR (padrão)"\n'
    }

    if (request.IMAGEM_BASE64) {
      prompt += 'IMAGEM_ANEXADA: SIM - Analise a imagem fornecida e gere conteúdo relacionado ao que você vê na imagem.\n'
      prompt += 'INSTRUCAO_ESPECIAL: Considere os elementos visuais da imagem como fonte de inspiração para títulos, roteiros e hashtags.\n'
    } else {
      prompt += 'IMAGEM_ANEXADA: NAO\n'
    }

    if (request.CONTEUDO_EXISTENTE) {
      prompt += 'CONTEUDO_EXISTENTE: ' + JSON.stringify(request.CONTEUDO_EXISTENTE, null, 2) + '\n'
      if (request.TIPO_DE_ACAO === 'REGENERAR_VARIACAO') {
        prompt += 'INSTRUCAO_VARIACAO: Gerar uma NOVA variação que NÃO repete literalmente títulos, hashtags, estrutura de roteiro ou pontos chave anteriores. Explore ângulo diferente (ex: dor > solução, mito > verdade, número específico, alerta, estudo, provocação). Manter coerência com tema.' + '\n'
      }
    }

    if (request.NOVA_INSTRUCAO) {
      prompt += 'NOVA_INSTRUCAO: "' + request.NOVA_INSTRUCAO + '"\n'
    }

    prompt += '\n\nINSTRUÇÕES ESPECÍFICAS PARA TÍTULOS:\n'
    prompt += '- O TITULO_PRINCIPAL deve ser CRIATIVO e diretamente relacionado ao TEMA_PRINCIPAL: "' + request.TEMA_PRINCIPAL + '"\n'
    prompt += '- Evite repetições e padrões óbvios como "NÃO...", "em 60 segundos", etc.\n'
    prompt += '- TITULOS_ALTERNATIVOS devem ser completamente diferentes entre si e do principal\n'
    prompt += '- Use variações de estrutura: perguntas, benefícios, números, urgência, etc.\n'

    if (request.TIPO_DE_ACAO === 'REGENERAR_VARIACAO') {
      prompt += '\nREGRAS_VARIACAO:\n'
      prompt += '- NÃO reutilizar exatamente frases ou hashtags do conteúdo anterior (pode manter 1-2 hashtags nucleares se inevitável, mas troque a ordem).\n'
      prompt += '- Mude o ângulo: se antes foi educativo, agora pode ser provocativo ou baseado em erro comum.\n'
      prompt += '- Títulos: alterar COMPLETAMENTE sintaxe; evitar repetir mesmas 3 primeiras palavras.\n'
      prompt += '- Roteiro: reescrever gancho com abordagem distinta.\n'
      prompt += '- Hashtags: embaralhar, substituir 40–60% por correlatas.\n'
    }

    // Campos adicionais solicitados
    if (request.PLATAFORMA_ALVO === 'YouTube') {
      prompt += '\nCAMPOS_ADICIONAIS_YOUTUBE:\n'
      prompt += '- Preencha TAGS_YOUTUBE: 8–12 tags curtas (sem #) relevantes para busca.\n'
      prompt += '- Preencha PALAVRAS_CHAVE_SEO: 5–8 keywords estratégicas (long-tail incluídas).\n'
      prompt += '- Preencha TEXTO_THUMBNAIL: 2–4 palavras IMPACTO (MAIÚSCULAS permitidas, sem emojis).\n'
      prompt += '- Preencha CTA_VARIANTES: 2–3 chamadas diferentes (ex: "Inscreva-se", "Salve isso", "Comente SUA META").\n'
    } else {
      prompt += '\nCAMPOS_ADICIONAIS_GERAIS:\n'
      prompt += '- Se fizer sentido, inclua CTA_VARIANTES (2 chamadas de engajamento diferentes).\n'
    }

    prompt += '\n\nIMPORTANTE: Responda APENAS com JSON válido. Não adicione nenhum texto antes ou depois do JSON. Comece diretamente com { e termine com }.'

    // DURAÇÃO ESPECÍFICA / SHORT FORM
    const durationSeconds = this.parseDurationToSeconds(request.DURACAO_ESTIMADA_VIDEO)
    const isShortPlatform = request.PLATAFORMA_ALVO === 'TikTok' || request.PLATAFORMA_ALVO === 'Instagram Reels'
    if (isShortPlatform && durationSeconds > 0 && durationSeconds <= 35) {
      const maxWords = Math.max(40, Math.min( (durationSeconds * 3), 110)) // ~3 palavras por segundo, limite superior
      prompt += '\n\nMODO_CURTA_DURACAO_ATIVADO: SIM (<= ' + durationSeconds + 's)\n'
      prompt += '- Estruture o ROTEIRO em 3 micro-blocos: HOOK (0-3s), VALOR (' + (durationSeconds > 8 ? '3-' + (durationSeconds - 3) + 's' : 'meio') + '), CTA (últimos 2-3s)\n'
      prompt += '- NÃO usar timestamps multi-minuto ou seções longas (proibido: 0:00, 2:30 - etc.)\n'
      prompt += '- ROTEIRO: texto enxuto, máximo ~' + maxWords + ' palavras, direto e falável\n'
      prompt += '- DESCRICAO_LEGENDA: 1-2 frases + CTA + hashtags, sem lista de timestamps\n'
      prompt += '- Evitar "guia completo" ou promessas incompatíveis com ' + durationSeconds + 's\n'
      prompt += '- FOCO: transmitir 1 ideia central memorável\n'
      prompt += '- Se imagem existir, conectar 1 elemento visual no HOOK sem dizer "na imagem"\n'
      prompt += '- GERE JSON consistente mesmo neste modo.\n'
    }

    return prompt
  }

  // Pós-processamento para garantir conformidade (remoção de padrões proibidos, ajuste de tamanho, variedade)
  private static postProcess(content: GeneratedContent, request: GenerationRequest): GeneratedContent {
    const bannedPatterns = [/60\s?segundos?/gi, /60s/gi, /guia completo/gi]
    const durationSeconds = this.parseDurationToSeconds(request.DURACAO_ESTIMADA_VIDEO)
    const isShortPlatform = content.PLATAFORMA_ALVO_GERADA === 'TikTok' || content.PLATAFORMA_ALVO_GERADA === 'Instagram Reels'
    const isShortForm = isShortPlatform && durationSeconds > 0 && durationSeconds <= 35
    const previous = request.CONTEUDO_EXISTENTE
    const isVariation = request.TIPO_DE_ACAO === 'REGENERAR_VARIACAO' && previous

    function cleanTitle(t: string, platform: string): string {
      let out = t.trim()
      bannedPatterns.forEach(r => { out = out.replace(r, '').trim() })
      // Evitar repetir tema inteiro isolado
      if (out.toLowerCase() === request.TEMA_PRINCIPAL.toLowerCase()) {
        out = 'Segredo de ' + request.TEMA_PRINCIPAL
      }
      // Limite para short form
      if ((platform === 'TikTok' || platform === 'Instagram Reels') && out.length > 38) {
        out = out.slice(0, 36).replace(/[\s,:;]+$/,'') + '…'
      }
      // Garantir algum diferencial
      // Adiciona um marcador de impacto simples se não houver pontuação forte ou emoji comum
      if (!/[!?]/.test(out) && (platform === 'TikTok' || platform === 'Instagram Reels')) {
        out += ' ⚡'
      }
      return out
    }

    content.TITULO_PRINCIPAL = cleanTitle(content.TITULO_PRINCIPAL, content.PLATAFORMA_ALVO_GERADA)
    content.TITULOS_ALTERNATIVOS = (content.TITULOS_ALTERNATIVOS || []).map(t => cleanTitle(t, content.PLATAFORMA_ALVO_GERADA))

    // Forçar diferença mínima em variação
    if (isVariation && previous) {
      function ensureDiff(newVal: string, oldVal: string): string {
        if (!oldVal) return newVal
        const normNew = newVal.toLowerCase().replace(/[^a-z0-9çãáàâéêíóôõúü ]/gi,'').trim()
        const normOld = oldVal.toLowerCase().replace(/[^a-z0-9çãáàâéêíóôõúü ]/gi,'').trim()
        if (normNew === normOld || normNew.startsWith(normOld.slice(0, Math.min(15, normOld.length)))) {
          // aplicar pequeno embaralhamento
          if (newVal.length > 10) {
            newVal = 'Novo ângulo: ' + newVal
          } else {
            newVal = newVal + ' ✅'
          }
        }
        return newVal
      }
      content.TITULO_PRINCIPAL = ensureDiff(content.TITULO_PRINCIPAL, previous.TITULO_PRINCIPAL)
      content.TITULOS_ALTERNATIVOS = content.TITULOS_ALTERNATIVOS.map((t,i) => ensureDiff(t, previous.TITULOS_ALTERNATIVOS[i] || ''))

      // Hashtags: se conjunto idêntico, embaralhar e substituir alguns tokens
      if (previous.HASHTAGS_TAGS && Array.isArray(previous.HASHTAGS_TAGS)) {
  const prevSet = previous.HASHTAGS_TAGS.map((h: string) => h.toLowerCase()).join('|')
        const newSet = content.HASHTAGS_TAGS.map(h => h.toLowerCase()).join('|')
        if (prevSet === newSet) {
          // substitui ~50% por variantes genéricas
          const replacements = ['#dica', '#alerta', '#hoje', '#agora', '#resultado', '#mindset', '#passoapasso', '#estrategia']
          content.HASHTAGS_TAGS = content.HASHTAGS_TAGS.map((h, idx) => idx % 2 === 1 && replacements[idx % replacements.length] ? replacements[idx % replacements.length] : h)
          // embaralhar simples
          content.HASHTAGS_TAGS.sort(() => Math.random() - 0.5)
        }
      }

      // Roteiro: se extremamente parecido em tamanho e inclui primeira frase igual, marcar início
      if (previous.ROTEIRO && content.ROTEIRO && previous.ROTEIRO.split('\n')[0] === content.ROTEIRO.split('\n')[0]) {
        content.ROTEIRO = '**Variação:**\n' + content.ROTEIRO
      }
    }

    // Remover duplicados
    const seen = new Set<string>()
    content.TITULOS_ALTERNATIVOS = content.TITULOS_ALTERNATIVOS.filter(t => {
      const low = t.toLowerCase()
      if (seen.has(low) || low === content.TITULO_PRINCIPAL.toLowerCase()) return false
      seen.add(low)
      return true
    })

    // Se acabou esvaziando, cria duas variações simples
    while (content.TITULOS_ALTERNATIVOS.length < 2) {
      const variants = [
        'Como aplicar ' + request.TEMA_PRINCIPAL,
        'Erro em ' + request.TEMA_PRINCIPAL + ' que te trava'
      ]
      for (const v of variants) {
        if (content.TITULOS_ALTERNATIVOS.length >= 2) break
        if (!seen.has(v.toLowerCase()) && v.toLowerCase() !== content.TITULO_PRINCIPAL.toLowerCase()) {
          content.TITULOS_ALTERNATIVOS.push(v)
          seen.add(v.toLowerCase())
        }
      }
      break
    }

    // --- Ajustes para SHORT FORM ---
    if (isShortForm) {
      // Comprimir descrição: remover timestamps e limitar tamanho
      if (content.DESCRICAO_LEGENDA) {
        // remove linhas com timestamps ou longas seções
        const lines = content.DESCRICAO_LEGENDA.split(/\r?\n/)
        const filtered = lines.filter(l => !/^\s*(\d{1,2}:\d{2}|\d{1,2}m\d{2}s|\d{1,2}:\d{2}\s*-)/.test(l))
          .filter(l => !/Introdução|Conclusão|Dicas Avançadas|Erros Comuns|Timestamps?/i.test(l))
        let compact = filtered.join(' ').replace(/\s{2,}/g,' ').trim()
        // limitar comprimento
        if (compact.length > 260) compact = compact.slice(0, 255).replace(/[,;\s]+$/,'') + '…'
        // garantir CTA
        if (!/segue|siga|curte|curta|compartilha|compartilhe/i.test(compact)) {
          compact += ' | Segue para mais insights.'
        }
        content.DESCRICAO_LEGENDA = compact
      }

      // Normalizar roteiro: transformar em 3 bullets se longo
      if (content.ROTEIRO) {
        const roteiroRaw = content.ROTEIRO
        // Se contém múltiplos cabeçalhos ou timestamps suspeitos, simplificar
        if (/##\s|0:00|1:00|2:00|Introdução|Conclusão/i.test(roteiroRaw) || roteiroRaw.length > 900) {
          // Extrair possível hook (primeira frase curta)
            const firstSentenceMatch = roteiroRaw.split(/[.!?]/).map(s => s.trim()).filter(Boolean)[0] || 'Gancho direto'
          const idea = 'Ideia central: ' + (request.TEMA_PRINCIPAL.length > 60 ? request.TEMA_PRINCIPAL.slice(0,57) + '…' : request.TEMA_PRINCIPAL)
          const cta = 'CTA: segue e envia para alguém que precisa.'
          content.ROTEIRO = '* Hook (0-3s): ' + firstSentenceMatch + '\n' + '* Valor (' + (durationSeconds > 8 ? '3-' + Math.max(5, durationSeconds - 3) + 's' : 'meio') + '): ' + idea + '\n' + '* ' + cta
        } else {
          // Mesmo que não seja longo, garantir ausência de timestamps
          content.ROTEIRO = content.ROTEIRO.replace(/^\s*(\d{1,2}:\d{2}.+)$\n?/gm, '')
        }
        // Reduzir tamanho total aproximado
        if (content.ROTEIRO.length > 400) {
          content.ROTEIRO = content.ROTEIRO.slice(0, 395).replace(/[,;\s]+$/,'') + '…'
        }
      }

      // Limitar hashtags a 5-6
      if (content.HASHTAGS_TAGS && content.HASHTAGS_TAGS.length > 6) {
        content.HASHTAGS_TAGS = content.HASHTAGS_TAGS.slice(0,6)
      }
    }

    // Normalização de hashtags: remover '#' inicial para evitar duplicação visual no frontend (# + tag)
    if (Array.isArray(content.HASHTAGS_TAGS)) {
      content.HASHTAGS_TAGS = content.HASHTAGS_TAGS
        .map(h => h.replace(/^#+/, '').trim())
        .filter((h, idx, arr) => h.length > 0 && arr.indexOf(h) === idx)
    }

    interface ExtendedContent extends GeneratedContent {
      TAGS_YOUTUBE?: string[]
      PALAVRAS_CHAVE_SEO?: string[]
      TEXTO_THUMBNAIL?: string
      CTA_VARIANTES?: string[]
    }
    const ext = content as ExtendedContent

    // Normalizar TAGS_YOUTUBE (sem #, minúsculas, sem espaços duplicados)
    if (Array.isArray(ext.TAGS_YOUTUBE)) {
      ext.TAGS_YOUTUBE = ext.TAGS_YOUTUBE
        .map(t => t.replace(/^#+/, '').toLowerCase().trim())
        .filter((t, i, arr) => t.length > 1 && arr.indexOf(t) === i)
        .slice(0, 12)
    }

    // Normalizar PALAVRAS_CHAVE_SEO (remover duplicadas, manter ordem, limitar a 10)
    if (Array.isArray(ext.PALAVRAS_CHAVE_SEO)) {
      const seenSeo = new Set<string>()
      ext.PALAVRAS_CHAVE_SEO = ext.PALAVRAS_CHAVE_SEO
        .map(k => k.trim())
        .filter(k => {
          const keyLower = k.toLowerCase()
          if (seenSeo.has(keyLower) || keyLower.length < 3) return false
          seenSeo.add(keyLower)
          return true
        })
        .slice(0, 10)
    }

    // Ajustar TEXTO_THUMBNAIL (2-4 palavras maiúsculas no máximo 24 chars)
    if (ext.TEXTO_THUMBNAIL) {
      let txt = ext.TEXTO_THUMBNAIL
      txt = txt.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9\s]/g,'').trim()
      const parts = txt.split(/\s+/).slice(0,4)
      txt = parts.join(' ').toUpperCase()
      if (txt.length > 24) txt = txt.slice(0,24).trim()
      ext.TEXTO_THUMBNAIL = txt
    }

    // CTA_VARIANTES: remover vazios, limitar 3
    if (Array.isArray(ext.CTA_VARIANTES)) {
      ext.CTA_VARIANTES = ext.CTA_VARIANTES
        .map(c => c.trim())
        .filter((c, i, arr) => c.length > 4 && arr.indexOf(c) === i)
        .slice(0,3)
    }

    return content
  }

  // Utilitário: tenta interpretar a duração em segundos a partir de formatos como
  // "15", "15s", "15 segundos", "00:15", "1:00", "2 minutos", "2min", "2m30s"
  private static parseDurationToSeconds(raw?: string): number {
    if (!raw) return 0
    const txt = raw.toLowerCase().trim()
    if (/^\d+$/.test(txt)) return parseInt(txt,10)
    if (/^\d+\s*s(ec(undos)?)?$/.test(txt)) return parseInt(txt,10)
    if (/^\d+\s*m(in(utos)?)?$/.test(txt)) return parseInt(txt,10)*60
    // mm:ss or m:ss
    const colon = txt.match(/^(\d{1,2}):(\d{2})$/)
    if (colon) return parseInt(colon[1],10)*60 + parseInt(colon[2],10)
    // XmYs
    const combo = txt.match(/^(\d+)m(\d{1,2})s$/)
    if (combo) return parseInt(combo[1],10)*60 + parseInt(combo[2],10)
    // X min Y s
    const spaced = txt.match(/^(\d+)\s*m(?:in(utos)?)?\s*(\d{1,2})\s*s/)
    if (spaced) return parseInt(spaced[1],10)*60 + parseInt(spaced[3],10)
    // Try to extract first number as seconds fallback
    const firstNumber = txt.match(/(\d+)/)
    return firstNumber ? parseInt(firstNumber[1],10) : 0
  }
}

