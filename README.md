# Sychat

Chat corporativo multi-tenant com Phoenix (Elixir) + Next.js (React).

## Estrutura

```
sychat/
├── chat_service/     # Backend Phoenix API-only
│   ├── lib/
│   │   ├── chat_service/
│   │   │   ├── auth/         # JWT auth
│   │   │   ├── chat/         # Messages, Channels
│   │   │   ├── accounts/     # Users, Memberships
│   │   │   └── tenants/      # Multi-tenant
│   │   └── chat_service_web/
│   │       └── channels/     # Phoenix Channels (realtime)
│   ├── config/
│   └── docker-compose.yml
│
└── web/              # Frontend Next.js
    └── src/
        └── lib/
            └── socket.ts     # Phoenix client
```

## Quick Start

### Backend (Phoenix)

```bash
cd chat_service

# Iniciar banco Docker
docker compose up -d

# Instalar deps e criar banco
mix deps.get
mix ecto.create
mix ecto.migrate

# Iniciar servidor
mix phx.server
```

API em http://localhost:4000

### Frontend (Next.js)

```bash
cd web

npm install
npm run dev
```

Web em http://localhost:3000

## Stack

- **Backend**: Phoenix 1.8, Elixir, Ecto, Postgres
- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Realtime**: Phoenix Channels (WebSocket)
- **Auth**: JWT (access + refresh)
- **DB**: Postgres 16 (Docker)

## Endpoints

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/tenants/:id/channels`
- `GET /api/channels/:id/messages`
- `WS /socket` - Phoenix Channels

## Events (WebSocket)

- `channel:{id}` - join canal
- `message:send` - enviar mensagem
- `message:new` - receber mensagem
