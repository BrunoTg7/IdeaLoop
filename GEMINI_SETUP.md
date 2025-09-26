# Configuração e Depuração da API Gemini

Este guia cobre desde a configuração básica até depuração de erros (404, 401, 429) e fallback de modelos.

## 1. Obter a Chave da API

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

## 2. Configurar no Projeto

1. Abra o arquivo `.env` na raiz do projeto
2. Substitua `your_gemini_api_key_here` pela sua chave real:

```env
VITE_GEMINI_API_KEY=AIzaSyD...sua-chave-aqui
```

## 3. Executar os Servidores

Para evitar problemas de CORS, você precisa executar dois servidores:

### Servidor Proxy (Backend)

```bash
npm run server
```

Este servidor roda em `http://localhost:3001` e faz as requisições para a API do Gemini.

### Aplicação Frontend

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 4. Testar a Integração

Após iniciar ambos os servidores, acesse `http://localhost:5173`, faça login e teste a geração de conteúdo.

## Funcionalidades da IA

- **Geração de Conteúdo Completo**: Títulos, descrições, roteiros e hashtags otimizados
- **Adaptação por Plataforma**: YouTube (detalhado), TikTok/Instagram (viral e rápido)
- **Sistema de Refinamento**: Permite melhorar títulos, roteiros ou todo o conteúdo
- **Prompt Estruturado**: Usa o prompt detalhado que você forneceu para resultados consistentes

## Modelos Suportados e Fallback

O backend tenta os modelos em ordem:

1. Valor definido em `GEMINI_MODEL` (se existir)
2. `gemini-1.5-flash`
3. `gemini-1.5-pro`
4. `gemini-1.0-pro`

Exemplo de `.env`:

```env
VITE_GEMINI_API_KEY=AIza...sua_chave
GEMINI_MODEL=gemini-1.5-flash
```

Se todos falharem, o servidor devolve uma resposta mock com as chaves adicionais:

```json
{
  "_fallback": true,
  "_modelsTried": ["gemini-1.5-flash", "gemini-1.5-pro"],
  "_lastError": { "status": 404 }
}
```

No frontend você pode detectar `_fallback` e avisar o usuário.

## Erros Comuns e Soluções

### 404 - NOT_FOUND

Motivo: Modelo inexistente ou ainda não habilitado para sua conta.
Checklist:

- Verifique se o nome está exatamente entre: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-1.0-pro`
- Não adicione sufixos como `-002` manualmente
- Veja lista oficial: https://ai.google.dev/gemini-api/docs/models

### 401 - UNAUTHENTICATED

Motivo: Chave inválida ou removida.
Checklist:

- Gere nova chave em: https://aistudio.google.com/app/apikey
- Verifique se não há espaços em branco no `.env`
- Reinicie o dev server após alterar `.env`

### 429 - RESOURCE_EXHAUSTED (Quota)

Motivo: Limite gratuito diário ou por minuto excedido.
Checklist:

- Espere o reset (normalmente 24h)
- Evite cliques repetidos no botão de geração
- Considere upgrade: https://ai.google.dev/gemini-api/docs/rate-limits

### Outros (500 / 503)

Motivo: Instabilidade temporária.
Checklist:

- Tentar novamente após alguns segundos
- Registrar `response.status` e `errorText` no log

## Teste Rápido da Chave (Manual)

Execute em um terminal Node:

```js
fetch(
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=MINHA_CHAVE",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] }),
  }
)
  .then((r) => r.text())
  .then(console.log);
```

Resultado esperado:

- 200 → Chave OK
- 401 → Chave inválida
- 404 → Modelo incorreto

## Ajustando Parâmetros de Geração

No arquivo `server.cjs` dentro de `generationConfig`:

```js
generationConfig: {
	temperature: 0.7,    // Criatividade
	topK: 40,
	topP: 0.95,
	maxOutputTokens: 4096,
}
```

- Diminua `temperature` se o JSON estiver vindo inconsistente
- Aumentar muito pode gerar quebras no formato

## Boas Práticas

- Não commitar `.env`
- Limitar gerações em série durante testes
- Exibir aviso quando `_fallback` for true

## Próximos Passos Sugeridos

1. Adicionar alerta visual no frontend para `_fallback`
2. Persistir métricas de falhas por modelo (observabilidade)
3. Implementar retentativa exponencial opcional para 503

Se quiser, posso implementar qualquer um desses próximos passos. É só pedir.
