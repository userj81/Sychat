# 🚀 Sychat: A Nova Fronteira do Chat Corporativo

[![Elixir Phoenix](https://img.shields.io/badge/Phoenix-v1.8-800080?style=flat-square&logo=phoenix-framework)](https://phoenixframework.org/)
[![Next.js](https://img.shields.io/badge/Next.js-v15-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Status](https://img.shields.io/badge/Status-Project_Complete-brightgreen?style=flat-square)](#)

**Sychat** não é apenas mais um chat. É uma plataforma de comunicação corporativa **multi-tenant**, robusta e preparada para escala global, construída com o que há de mais moderno no ecossistema Elixir e React.

Inspirado na agilidade do Slack e na familiaridade do WhatsApp, o Sychat entrega uma experiência "real-time" pura, sem compromissos.

---

## ✨ Por que Sychat?

O mercado está saturado de soluções lentas e complexas. Sychat foca em **estabilidade, baixa latência e governança**.

### 🛠️ Funcionalidades de Elite

- 💬 **Threads Organizadas:** Discussões paralelas que não poluem o canal principal.
- 📂 **Anexos & Media:** Compartilhamento de arquivos e imagens com pré-visualização instantânea.
- ⚡ **Real-Time Total:** Typing indicators, Presence (quem está online?) e Read Receipts.
- 🎭 **Reações Modernas:** Expresse-se com emojis em qualquer mensagem, sincronizados via WebSockets.
- 🏢 **Multi-Tenancy Nativo:** Isolamento completo de dados entre organizações (Tenants).
- 🛡️ **Governança:** Soft Deletes e gerenciamento refinado de membros e administradores.

---

## 🏗️ Arquitetura de Ponta

O Sychat foi desenhado para ser resiliente.

### **Backend (The Engine)**

Aproveita a **BEAM (Erlang VM)** para suportar milhões de conexões simultâneas com latência sub-milissegundo.

- **Elixir & Phoenix Channels:** WebSockets de alta performance.
- **PostgreSQL:** Persistência robusta com schemas multi-tenant.
- **Phoenix Presence:** Monitoramento de estado distribuído.

### **Frontend (The Experience)**

Interface limpa, rápida e responsiva.

- **Next.js 15 & React 19:** O estado da arte em performance web.
- **Zustand:** Gerenciamento de estado global simplificado.
- **Tailwind CSS:** Estética "Glassmorphism" e Dark Mode nativo.

---

## 🚀 Começando

### Pré-requisitos

- Docker
- Elixir (v1.17+)
- Node.js (v20+)

### 🏁 Setup Rápido

1.  **Clone o repositório**
2.  **Lançar o Banco de Dados:**
    ```bash
    cd chat_service
    docker compose up -d
    ```
3.  **Configurar o Backend:**
    ```bash
    mix deps.get
    mix ecto.setup
    mix phx.server
    ```
4.  **Lançar o Web Client:**
    ```bash
    cd ../web
    npm install
    npm run dev
    ```

Acesse em: `http://localhost:3000`

---

## 📈 Próximos Passos (Roadmap)

- [ ] Integração com Video-Chamadas via WebRTC.
- [ ] Aplicativos Mobile Nativos (React Native).
- [ ] Busca Avançada com Elasticsearch/Meilisearch.
- [ ] Automação via Webhooks e API Pública.

---

## 🤝 Contribua

Sychat é um projeto em constante evolução. Se você vê potencial, junte-se a nós para construir a próxima grande ferramenta de colaboração.

---

> Orgulhosamente desenvolvido com **Elixir** e **Next.js**.
