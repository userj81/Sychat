# Plano de Frontend - Sychat (Estilo WhatsApp Web)

## Visão Geral

Interface estilo WhatsApp Web com sidebar esquerda (lista de conversas) + área direita (chat). Foco em usabilidade mobile-first mas otimizado para desktop.

---

## Estrutura de Pastas

```
web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (main)/
│   │   ├── layout.tsx        # Layout autenticado
│   │   ├── page.tsx          # Redirect para workspace
│   │   └── t/
│   │       └── [slug]/
│   │           ├── layout.tsx  # Layout do workspace
│   │           ├── page.tsx    # Sidebar + Chat
│   │           └── c/
│   │               └── [channelId]/
│   │                   └── page.tsx
│   └── layout.tsx
│
├── components/
│   ├── ui/                   # Componentes base
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   └── modal.tsx
│   │
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   │
│   ├── layout/
│   │   ├── sidebar.tsx       # Lista canais/DMs
│   │   ├── header.tsx        # Topo com info do canal
│   │   └── workspace-list.tsx
│   │
│   ├── chat/
│   │   ├── message-list.tsx  # Scroll de mensagens
│   │   ├── message-item.tsx  # Uma mensagem
│   │   ├── composer.tsx      # Input de enviar msg
│   │   └── typing-indicator.tsx
│   │
│   └── channels/
│       ├── channel-item.tsx
│       ├── create-channel-modal.tsx
│       └── invite-modal.tsx
│
├── lib/
│   ├── api.ts               # Client REST
│   ├── socket.ts            # Phoenix Channels
│   ├── auth.ts              # Token management
│   └── hooks/
│       ├── use-auth.ts
│       ├── use-channel.ts
│       └── use-socket.ts
│
├── stores/
│   └── chat-store.ts        # Zustand store
│
└── types/
    └── index.ts             # TypeScript interfaces
```

---

## Interfaces TypeScript

```typescript
// types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'dm';
  is_private: boolean;
}

export interface Message {
  id: string;
  body: string;
  client_id: string;
  user: {
    id: string;
    name: string;
  };
  edited_at: string | null;
  deleted_at: string | null;
  inserted_at: string;
}

export interface ChannelsResponse {
  public: Channel[];
  private: Channel[];
  dms: Channel[];
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}
```

---

## Fluxo de Telas

### 1. Login (`/login`)
- Email + Senha
- Botão "Entrar"
- Link para Register
- Armazena tokens no localStorage

### 2. Registro (`/register`)
- Nome + Email + Senha
- Após registro, faz login automático
- Redirect para seleção de workspace

### 3. Seleção de Workspace (`/`)
- Lista de tenants que o usuário participa
- Click → entra no workspace

### 4. Workspace Principal (`/t/[slug]`)
- **Sidebar esquerda (30%):**
  - Header: nome do workspace + settings
  - Canais públicos (ícone #)
  - Canais privados (ícone lock)
  - DMs (ícone usuário)
  - Botão "+" para criar canal

- **Área direita (70%):**
  - Se nenhuma conversa selecionada: "Selecione uma conversa"
  - Se conversa selecionada: Chat completo

### 5. Chat (`/t/[slug]/c/[channelId]`)
- **Header:** Nome do canal, membros online
- **Message List:** Mensagens com:
  - Avatar + nome do usuário
  - Texto
  - Hora (formato WhatsApp: "ontem", "14:32")
  -own reactions (futuro)
- **Composer:**
  - Input de texto
  - Enter → enviar
  - Shift+Enter → nova linha
  - Indicador "digitando..."

---

## Componentes Principais

### Sidebar
```
┌─────────────────────┐
│ 🚀 Minha Empresa  ⚙️│
├─────────────────────┤
│ CANAIS              │
│ # geral             │
│ # random            │
│ # projetos          │
├─────────────────────┤
│ PRIVADOS            │
│ 🔒 liderança        │
├─────────────────────┤
│ MENSAGENS DIRETAS  │
│ 👤 João             │
│ 👤 Maria            │
│ + Novo Canal        │
└─────────────────────┘
```

### Chat Area
```
┌─────────────────────────────────────────┐
│ # geral                             👤 👥 │
├─────────────────────────────────────────┤
│                                          │
│  João  14:32                             │
│  Olá pessoal! 👋                         │
│                                          │
│         14:35                            │
│  Vocês viram o novo layout?              │
│                                          │
│  Maria  14:36                            │
│  Sim! Está muito bonito 🎉               │
│                                          │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐  │
│ │ Digite uma mensagem...          📎  │  │
│ └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Integração Phoenix Channels

```typescript
// lib/socket.ts
import { Socket } from "phoenix";

let socket: Socket | null = null;

export function connectSocket(token: string) {
  if (socket) socket.disconnect();
  
  socket = new Socket("http://localhost:4000/socket", {
    params: { token, tenant_id: localStorage.getItem("tenant_id") }
  });
  
  socket.connect();
  return socket;
}

export function getSocket() {
  return socket;
}

export function joinChannel(channelId: string) {
  if (!socket) throw new Error("Socket not connected");
  return socket.channel(`channel:${channelId}`, {
    tenant_id: localStorage.getItem("tenant_id")
  });
}
```

---

## API Client

```typescript
// lib/api.ts
const API_URL = "http://localhost:4000/api/v1";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("access_token")}`
  };
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetch(`${API_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, password })
      }).then(r => r.json()),
    
    register: (data: { email: string; password: string; name: string }) =>
      fetch(`${API_URL}/auth/register`, {
        method: "POST",
        body: JSON.stringify(data)
      }).then(r => r.json()),
      
    me: () => fetch(`${API_URL}/me`, { headers: getHeaders() }).then(r => r.json()),
    
    refresh: (refresh_token: string) =>
      fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        body: JSON.stringify({ refresh_token })
      }).then(r => r.json())
  },
  
  tenants: {
    list: () => fetch(`${API_URL}/tenants`, { headers: getHeaders() }).then(r => r.json()),
    create: (data: { name: string; slug: string }) =>
      fetch(`${API_URL}/tenants`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
      }).then(r => r.json())
  },
  
  channels: {
    list: (tenantId: string) =>
      fetch(`${API_URL}/tenants/${tenantId}/channels`, { headers: getHeaders() }).then(r => r.json()),
    
    create: (tenantId: string, data: { name: string; type: string }) =>
      fetch(`${API_URL}/tenants/${tenantId}/channels`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
      }).then(r => r.json()),
    
    messages: (channelId: string, cursor?: string) => {
      const url = cursor 
        ? `${API_URL}/channels/${channelId}/messages?cursor=${cursor}`
        : `${API_URL}/channels/${channelId}/messages`;
      return fetch(url, { headers: getHeaders() }).then(r => r.json());
    },
    
    sendMessage: (channelId: string, body: string, clientId: string) =>
      fetch(`${API_URL}/channels/${channelId}/messages`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ body, client_id: clientId })
      }).then(r => r.json())
  }
};
```

---

## Zustand Store

```typescript
// stores/chat-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatState {
  // Auth
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  
  // Workspace
  tenants: Tenant[];
  currentTenant: Tenant | null;
  setTenants: (tenants: Tenant[]) => void;
  setCurrentTenant: (tenant: Tenant) => void;
  
  // Channels
  channels: { public: Channel[]; private: Channel[]; dms: Channel[] };
  currentChannel: Channel | null;
  setChannels: (channels: { public: Channel[]; private: Channel[]; dms: Channel[] }) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  
  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, currentTenant: null, currentChannel: null }),
      
      tenants: [],
      currentTenant: null,
      setTenants: (tenants) => set({ tenants }),
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      
      channels: { public: [], private: [], dms: [] },
      currentChannel: null,
      setChannels: (channels) => set({ channels }),
      setCurrentChannel: (channel) => set({ currentChannel: channel }),
      
      messages: [],
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      setMessages: (messages) => set({ messages })
    }),
 "sych    { name:at-storage" }
  )
);
```

---

## Ordem de Implementação

### Fase 1: Autenticação (1 dia)
1. Tipos + API client
2. Zustand store
3. Página Login
4. Página Register
5. Redirects autenticados

### Fase 2: Workspaces (1 dia)
1. Lista de tenants
2. Seleção de workspace
3. Sidebar com canais
4. Criar canal (modal)

### Fase 3: Chat (2 dias)
1. Lista de mensagens (REST)
2. Composer + enviar mensagem
3. Phoenix Channels (realtime)
4. Scroll infinito (load more)

### Fase 4: Melhorias (1 dia)
1. DMs
2. Indicador "digitando..."
3. Preview de canal
4. Loading states

---

## Tecnologias

- **Framework:** Next.js 15 (App Router)
- **Estilização:** TailwindCSS
- **Estado:** Zustand (persistido)
- **HTTP:** Fetch API
- **Realtime:** Phoenix Client
- **Ícones:** Heroicons
- **Date:** date-fns

---

## Preview Visual

```
┌──────────────────────────────────────────────────────────────────┐
│  🔒 Sychat                                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌────────────────┐ ┌────────────────────────────────────────┐ │
│   │ # geral        │ │ # geral                                    │
│   │ # projetos     │ │                                            │
│   │ # random       │ │ ┌────────────────────────────────────┐  │ │
│   │                │ │ │ 👤 João  14:32                     │  │ │
│   │ ──────────────│ │ │ Olá! Como vocês estão?             │  │ │
│   │                │ │ └────────────────────────────────────┘  │ │
│   │ 🔒 lider       │ │                                            │
│   │ 🔒 tech        │ │           14:35                            │
│   │                │ │ Vocês viram o novo projeto?               │
│   │ ──────────────│ │                                            │
│   │                │ │ ┌────────────────────────────────────┐  │ │
│   │ 👤 Maria       │ │ │ 👤 Maria  14:36                   │  │ │
│   │ 👤 João        │ │ │ Sim, está muito bom! 🎉           │  │ │
│   │ 👤 Pedro       │ │ └────────────────────────────────────┘  │ │
│   │                │ │                                            │
│   │ + Novo Canal   │ ├────────────────────────────────────────┤ │
│   └────────────────┘ │ ┌────────────────────────────────────┐  │ │
│                       │ │ Digite uma mensagem...          📎  │  │
│                       │ └────────────────────────────────────┘  │ │
│                       └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```
