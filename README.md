# Postou

> Sua empresa postando todos os dias.

O Postou aprende sobre sua marca e transforma novidades do seu negócio em posts prontos para publicar no Instagram.

## Como funciona

1. **Você compartilha novidades** — texto curto ou foto sobre o que aconteceu no seu negócio.
2. **A IA aprende sua marca** — paleta, tom de voz, persona, contexto histórico viram memória vetorial.
3. **Posts são gerados automaticamente** — carrossel, post ou story, no horário que você escolher.

## Stack

- **Frontend:** Next.js 16 (App Router) + Tailwind v4 + Framer Motion
- **Backend:** Supabase (Postgres + pgvector + Auth + Storage)
- **IA:** OpenAI (GPT-4o-mini para texto, gpt-image para imagem, text-embedding-3-small para vetores)
- **Geração assíncrona:** Supabase Edge Functions + pg_cron
- **Hospedagem:** Vercel

## Arquitetura

```
Usuário envia update → API classify + embed → salva no Supabase com vetor 1536d
                                                         ↓
                          pg_cron dispara Edge Function diariamente
                                                         ↓
                Planner agent decide tema → vector search → generate pack
                                                         ↓
                                              gpt-image-2 renderiza
                                                         ↓
                                          Salva no Storage + DB
```

## Rodando localmente

```bash
# Instala dependências
npm install

# Configura .env.local com:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# OPENAI_API_KEY=
# GOOGLE_AI_API_KEY=  (opcional, pra video test)

# Roda o dev server
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estrutura

```
src/
├── app/
│   ├── (app)/          # área autenticada (feed, content, settings)
│   ├── api/            # routes server (updates, generate, classify)
│   ├── blog/           # blog posts
│   ├── sobre/          # página institucional
│   ├── termos/         # ToS
│   ├── privacidade/    # política LGPD
│   └── page.tsx        # landing
├── components/         # componentes compartilhados
├── content/posts/      # markdown-like dos posts do blog
└── lib/                # clientes supabase, helpers
supabase/
└── functions/          # Edge Functions Deno (generate-pack, cron-dispatch)
```

## Status

🚧 Em desenvolvimento — preparando lançamento beta.
