const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const multer = require("multer");

const app = express();
const PORT = 3001;

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Generate mock content based on platform and topic
function generateMockContent(platform, topic) {
  const contentGenerators = {
    YouTube: generateYouTubeContent,
    TikTok: generateTikTokContent,
    "Instagram Reels": generateInstagramContent,
  };

  const generator = contentGenerators[platform] || contentGenerators["YouTube"];
  return generator(topic);
}

function generateYouTubeContent(topic) {
  // Generate dynamic titles based on the topic
  const baseTopic = topic.toLowerCase();

  return {
    PLATAFORMA_ALVO_GERADA: "YouTube",
    TITULO_PRINCIPAL: `Como Aprender ${baseTopic} para Iniciantes 2025 - Guia COMPLETO`,
    TITULOS_ALTERNATIVOS: [
      `${baseTopic} 2025: Estratégias que MULTIPLICAM seu Dinheiro`,
      `${baseTopic} EXPLICADO: Do Zero à Lucro Real`,
    ],
    DESCRICAO_LEGENDA: `🔥 ${baseTopic} EXPLICADO de forma SIMPLES e DIRETA! Se você quer aprender ${baseTopic} do zero, este vídeo é OBRIGATÓRIO!

⏰ TIMESTAMPS:
0:00 - Introdução
2:30 - Conceitos Básicos
5:45 - Estratégias Práticas
10:20 - Erros Comuns (EVITE!)
15:00 - Dicas Avançadas
20:00 - Conclusão

💰 RECURSOS MENCIONADOS:
• [Link para material gratuito]
• [Link para curso completo]
• [Link para comunidade]

📈 O que você vai aprender:
✅ Conceitos fundamentais
✅ Estratégias comprovadas
✅ Estudos de caso reais
✅ Dicas de especialistas
✅ Planilha de acompanhamento

🚀 Não esqueça de:
👍 CURTIR o vídeo
🔔 ATIVAR as notificações
💬 COMENTAR suas dúvidas
🔗 SE INSCREVER no canal

#${baseTopic.replace(
      /\s+/g,
      ""
    )} #EducaçãoFinanceira #AprendaInvestir #MercadoFinanceiro #2025 #SucessoFinanceiro

⚠️ DISCLAIMER: Este vídeo é apenas informativo. Invista com responsabilidade e consulte profissionais qualificados.`,
    HASHTAGS_TAGS: [
      `#${baseTopic.replace(/\s+/g, "")}`,
      "#EducaçãoFinanceira",
      "#AprendaInvestir",
      "#MercadoFinanceiro",
      "#2025",
      "#SucessoFinanceiro",
      "#Dinheiro",
      "#Riqueza",
      "#Investimentos",
    ],
    ROTEIRO: `# ${baseTopic} - Guia Completo 2025

## Introdução (0:00 - 2:30)
Olá pessoal! Bem-vindos ao canal! Hoje vamos falar sobre ${baseTopic} - um tema que mudou completamente minha visão sobre dinheiro e futuro.

Se você está começando agora ou já tem experiência, este vídeo vai te dar insights valiosos e práticos para 2025.

## Conceitos Básicos (2:30 - 5:45)
Antes de tudo, vamos entender o que é ${baseTopic} e por que isso é importante para seu futuro financeiro.

### O que é ${baseTopic}?
${baseTopic} representa uma oportunidade de multiplicar seu dinheiro através do conhecimento e estratégia.

### Por que investir em ${baseTopic}?
• Potencial de retorno acima da inflação
• Diversificação de renda
• Construção de patrimônio
• Liberdade financeira

## Estratégias Práticas (5:45 - 10:20)
Agora vamos para a prática! Vou mostrar estratégias testadas e aprovadas.

### Estratégia 1: Iniciante
• Comece pequeno
• Estude antes de investir
• Diversifique seus investimentos
• Tenha paciência

### Estratégia 2: Intermediário
• Análise fundamental
• Timing de mercado
• Gestão de risco
• Rebalanceamento

## Erros Comuns (10:20 - 15:00)
⚠️ EVITE estes erros comuns que vejo todos os dias:

• Investir sem conhecimento
• Colocar tudo em um lugar só
• Pânico nas quedas
• Ganância excessiva

## Dicas Avançadas (15:00 - 20:00)
Para quem quer ir além do básico:

• Análise técnica
• Mindset de investidor
• Educação continuada
• Networking com investidores

## Conclusão (20:00 - 22:00)
${baseTopic} pode ser sua porta de entrada para a liberdade financeira, mas exige estudo, disciplina e paciência.

Lembre-se: o sucesso nos investimentos não acontece da noite pro dia, mas com consistência e educação.

Obrigado por assistir! Curtiu o vídeo? Deixe seu like, compartilhe com os amigos e se inscreva para mais conteúdos sobre investimentos.

Até a próxima! 💰📈`,
    PONTOS_CHAVE_DO_VIDEO: [
      `Introdução completa sobre ${baseTopic}`,
      "Conceitos fundamentais explicados",
      "Estratégias práticas demonstradas",
      "Erros comuns e como evitá-los",
      "Dicas avançadas para profissionais",
      "Conclusão com call-to-action",
    ],
  };
}

function generateTikTokContent(topic) {
  // Generate dynamic content based on the topic
  const baseTopic = topic.toLowerCase();

  return {
    PLATAFORMA_ALVO_GERADA: "TikTok",
    TITULO_PRINCIPAL: `${baseTopic} em 60s 🔥`,
    TITULOS_ALTERNATIVOS: [
      `Como GANHAR dinheiro com ${baseTopic} 📈`,
      `${baseTopic} que vão TE FAZER rico 💰`,
    ],
    DESCRICAO_LEGENDA: `POV: Você quer aprender ${baseTopic} mas tá perdido 🤯

Este vídeo vai te mostrar TUDO que você precisa saber em 60 segundos! 

💡 DICAS RÁPIDAS:
• Comece pequeno mas consistente
• Estude antes de investir
• Diversifique seus investimentos
• Tenha paciência

🔥 Se você quer aprender mais sobre ${baseTopic}, siga para mais dicas diárias!

💬 Qual sua maior dúvida sobre ${baseTopic}? Responda nos comentários!

#${baseTopic.replace(
      /\s+/g,
      ""
    )} #TikTokEduca #AprendaComigo #DicasRapidas #Investimentos #Dinheiro #Riqueza #2025 #TikTokBrasil`,
    HASHTAGS_TAGS: [
      `#${baseTopic.replace(/\s+/g, "")}`,
      "#TikTokEduca",
      "#AprendaComigo",
      "#DicasRapidas",
      "#Investimentos",
      "#Dinheiro",
      "#Riqueza",
      "#2025",
      "#TikTokBrasil",
      "#Viral",
    ],
    ROTEIRO: `# ${topic} em 60 Segundos - TikTok

## GANCHO (0-3s) - CRÍTICO!
[Visual impactante com música alta]
POV: Você quer ficar rico mas não sabe como! 💰
[Texto na tela: "Aprenda ${baseTopic} AGORA"]

## DESENVOLVIMENTO RÁPIDO (3-50s)

### Parte 1 (3-15s): O Problema
[Transições rápidas, texto na tela]
• Todo mundo quer dinheiro
• Mas ninguém ensina como
• Até hoje... 👀

### Parte 2 (15-35s): A Solução
[Gráficos animados, voz energética]
• ${topic} é mais simples do que parece
• 3 passos básicos:
  1. Aprenda os conceitos
  2. Comece pequeno
  3. Seja consistente

### Parte 3 (35-50s): Prova Social
[Depoimentos rápidos, estatísticas]
• Pessoas comuns fazendo dar certo
• Resultados reais
• "Funcionou pra mim!" - comentários

## ENCERRAMENTO (50-60s)
[Call-to-action forte, música crescente]
SE INSCREVA no canal para mais dicas!
CURTE se aprendeu algo novo!
SALVA este vídeo!

[Texto final: "Aprenda ${baseTopic} hoje mesmo!"]

⚡ Música: Trend atual do TikTok
🎬 Edição: Cortes rápidos, zooms, efeitos`,
    PONTOS_CHAVE_DO_VIDEO: [
      "Gancho visual impactante nos primeiros 3 segundos",
      "Explicação rápida e objetiva do conceito",
      "Demonstração prática em tempo real",
      "Call-to-action forte no final",
      "Música e edição viral",
    ],
  };
}

function generateInstagramContent(topic) {
  // Generate dynamic titles based on the topic
  const baseTopic = topic.toLowerCase();
  const shortTopic =
    baseTopic.length > 20 ? baseTopic.substring(0, 20) + "..." : baseTopic;

  return {
    PLATAFORMA_ALVO_GERADA: "Instagram Reels",
    TITULO_PRINCIPAL: `${shortTopic.toUpperCase()} no Reels 🔥`,
    TITULOS_ALTERNATIVOS: [
      `${shortTopic} em 60 segundos 📈`,
      `Como FAZER ${shortTopic.toUpperCase()} no Reels 💰`,
    ],
    DESCRICAO_LEGENDA: `POV: Você quer aprender ${baseTopic} mas não sabe por onde começar 🤯

Este Reels vai te mostrar os 3 PASSOS para começar ${baseTopic} hoje mesmo!

💡 PASSO 1: Aprenda os básicos
💡 PASSO 2: Comece com pouco
💡 PASSO 3: Seja consistente

🔥 Se você quer mais dicas sobre ${baseTopic}, siga o perfil e ative as notificações!

💬 Qual dessas dicas você vai aplicar primeiro?

👥 MARQUE um amigo que precisa ver isso!

#${baseTopic
      .replace(/\s+/g, "")
      .replace(
        /[^a-zA-Z0-9]/g,
        ""
      )} #Reels #Instagram #AprendaNoReels #DicasDeHoje #Investimentos #Dinheiro #Riqueza #2025 #ReelsBrasil`,
    HASHTAGS_TAGS: [
      `#${baseTopic.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "")}`,
      "#Reels",
      "#Instagram",
      "#AprendaNoReels",
      "#DicasDeHoje",
      "#Investimentos",
      "#Dinheiro",
      "#Riqueza",
      "#2025",
      "#ReelsBrasil",
    ],
    ROTEIRO: `# ${baseTopic} no Instagram Reels

## ABERTURA (0-3s) - Gancho Visual
[Música trending, texto grande na tela]
"QUER APRENDER ${baseTopic.toUpperCase()}? 🤯"
[Transição rápida com efeito]

## CONTEÚDO PRINCIPAL (3-45s)

### Parte 1 (3-15s): O Desafio
[Texto na tela, voz confiante]
• Todo mundo quer resultados
• Mas poucos sabem como
• A verdade é mais simples...

### Parte 2 (15-35s): A Solução
[Gráficos, animações, voz energética]
• ${baseTopic} em 3 passos fáceis:
  1. [Passo 1 explicado]
  2. [Passo 2 demonstrado]
  3. [Passo 3 aplicado]

### Parte 3 (35-45s): Benefícios
[Lista de benefícios, checkmarks]
• Resultados comprovados
• Método testado
• Funciona para todos

## FECHAMENTO (45-60s) - CTA Forte
[Música crescendo, texto piscando]
SEGUIR para mais dicas!
SALVAR este Reels!
COMPARTILHAR com amigos!

[Texto final grande]
"Aprenda ${baseTopic} AGORA!"

🎵 Música: Trending no Instagram
🎬 Edição: Cortes dinâmicos, efeitos visuais
📱 Formato: 9:16 vertical`,
    PONTOS_CHAVE_DO_VIDEO: [
      "Gancho visual forte nos primeiros segundos",
      "Conteúdo dividido em 3 partes claras",
      "Demonstração prática e visual",
      "Call-to-action múltiplo",
      "Formatação otimizada para Reels",
    ],
  };
}

// Gemini API proxy endpoint
app.post("/api/gemini", upload.single("image"), async (req, res) => {
  try {
    const { apiKey, prompt, imageBase64 } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Dynamic model fallback list
    const modelEnv =
      process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim();
    const candidateModels = [];
    if (modelEnv) candidateModels.push(modelEnv);
    // Default ordered fallback sequence
    [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
    ].forEach((m) => {
      if (!candidateModels.includes(m)) candidateModels.push(m);
    });

    console.log(
      "Attempting Gemini models in order:",
      candidateModels.join(", ")
    );

    // Prepare image (only once) so we can reuse in each attempt
    let imageData = null;
    if (req.file) {
      imageData = req.file.buffer.toString("base64");
    } else if (imageBase64) {
      imageData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    }

    let lastError = null;
    for (const model of candidateModels) {
      const modelUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
      console.log(`[Gemini] Trying model: ${model}`);

      const requestBody = {
        contents: [
          {
            parts: [
              // text part will be last after potential image part insertion
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      };

      if (imageData) {
        requestBody.contents[0].parts.push({
          inline_data: {
            mime_type: req.file ? req.file.mimetype : "image/jpeg",
            data: imageData,
          },
        });
        if (model === candidateModels[0]) {
          console.log("Image added to Gemini API request");
        }
      }
      requestBody.contents[0].parts.push({ text: prompt });

      let response;
      try {
        response = await fetch(`${modelUrl}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
      } catch (networkErr) {
        console.error(`[Gemini] Network error for model ${model}:`, networkErr);
        lastError = networkErr;
        continue; // try next model
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Gemini] HTTP ${response.status} for model ${model}:`,
          errorText
        );

        // Specific handling
        if (response.status === 429) {
          return res.status(429).json({
            error: {
              code: 429,
              model,
              message:
                "Quota exceeded (429). Aumente o plano ou aguarde o reset diário. https://ai.google.dev/gemini-api/docs/rate-limits",
            },
          });
        }
        if (response.status === 401) {
          return res.status(401).json({
            error: {
              code: 401,
              model,
              message:
                "Credenciais inválidas (401). Verifique se a API Key do Google AI está correta e se a API Gemini está habilitada no console.",
            },
          });
        }
        if (response.status === 404) {
          // Try next model
          lastError = { status: 404, text: errorText, model };
          continue;
        }
        // Other errors -> try next but store
        lastError = { status: response.status, text: errorText, model };
        continue;
      }

      // Success
      try {
        const data = await response.json();
        console.log(`[Gemini] Success with model ${model}`);
        return res.json(data);
      } catch (parseErr) {
        console.error(
          `[Gemini] JSON parse error for model ${model}:`,
          parseErr
        );
        lastError = parseErr;
        continue;
      }
    }

    // All models failed -> fallback to mock
    console.warn("All Gemini model attempts failed. Using mock fallback.");
    if (lastError) console.warn("Last error: ", lastError);

    const platformMatch = prompt.match(/PLATAFORMA_ALVO:\s*"([^"]+)"/);
    const topicMatch = prompt.match(/TEMA_PRINCIPAL:\s*"([^"]+)"/);
    const platform = platformMatch ? platformMatch[1] : "YouTube";
    const topic = topicMatch ? topicMatch[1] : "Investimentos em Ações";

    const mockContent = generateMockContent(platform, topic);
    return res.status(200).json({
      candidates: [
        {
          content: { parts: [{ text: JSON.stringify(mockContent) }] },
        },
      ],
      _fallback: true,
      _modelsTried: candidateModels,
      _lastError: lastError,
    });
  } catch (error) {
    console.error("Proxy server error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Gemini API Proxy server running on http://localhost:${PORT}`);
});
