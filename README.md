# IdeaLoop

Uma plataforma de geração de conteúdo otimizado para múltiplas plataformas usando IA.

## Funcionalidades

- Geração de conteúdo para YouTube, TikTok e Instagram Reels
- Otimização automática de títulos, descrições e roteiros
- Sistema de autenticação com Supabase
- Planos de uso flexíveis

## Configuração

### 1. Clonagem e Dependências

```bash
git clone <repository-url>
cd IdeaLoop
npm install
```

### 2. Configuração das APIs

#### Supabase

O projeto já vem configurado com as credenciais do Supabase. Se precisar alterar, edite o arquivo `.env`:

```env
VITE_SUPABASE_URL=https://xsnlakitigdsaxtjolvr.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Google Gemini API

Para usar a geração de conteúdo com IA, você precisa configurar uma chave da API do Google Gemini:

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma nova chave de API
3. Adicione a chave no arquivo `.env`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Executar a Aplicação Completa

Para desenvolvimento, execute ambos os servidores simultaneamente:

```bash
npm run dev:full
```

Isso iniciará:

- Servidor proxy da API Gemini em `http://localhost:3001`
- Aplicação frontend em `http://localhost:5173`

### 4. Executar Separadamente (se necessário)

#### Servidor Proxy apenas:

```bash
npm run server
```

#### Frontend apenas:

```bash
npm run dev
```

## Estrutura do Projeto

```
src/
├── components/     # Componentes React
├── hooks/         # Hooks customizados
├── lib/           # Configurações (Supabase)
├── services/      # Serviços (AI, etc.)
└── types/         # Definições de tipos TypeScript
```

## Tecnologias Utilizadas

## Campos Avançados Gerados pela IA

Além dos campos básicos (título, roteiro, descrição, hashtags), a IA pode gerar campos avançados para YouTube e outros formatos:

- **TAGS_YOUTUBE**: Lista de tags otimizadas para busca no YouTube (sem #, até 12 tags).
- **PALAVRAS_CHAVE_SEO**: Palavras-chave estratégicas para SEO, incluindo long-tail (até 10).
- **TEXTO_THUMBNAIL**: Sugestão de texto curto (2–4 palavras, máx. 24 caracteres) para thumbnail de vídeo.
- **CTA_VARIANTES**: 2–3 chamadas para ação diferentes (ex: "Inscreva-se", "Comente sua meta").

Esses campos aparecem automaticamente na interface ao gerar conteúdo para YouTube ou quando relevantes para outras plataformas.

Na exportação CSV/JSON, todos os campos avançados são incluídos.
