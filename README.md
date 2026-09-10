<div align="center">

# 🔗 BlockStack

**Transforme seu link em uma página que trabalha por você.**

Não é só um agregador de links — é um construtor de mini-sites por blocos, com tema escuro, editor visual em tempo real e analytics próprio.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](#-licença)

</div>

---

## 📌 Sobre o projeto

O **BlockStack** nasceu da ideia de que uma página de perfil não precisa ser só uma lista de botões. Em vez de "aqui estão meus links", a proposta é **"aqui está tudo que eu sou, faço, vendo e quero que você faça"**.

Tudo na plataforma é um **Block**: perfil, link, produto, serviço, redes sociais, newsletter, galeria e outros — cada um reordenável, editável e estilizável de forma independente, mas seguindo um design system único e consistente.

## ✨ Funcionalidades

### Disponível hoje
- 🧱 **Editor de blocos com drag & drop** — monte sua página arrastando e reordenando blocos em tempo real
- 🎨 **Sistema de temas** — presets visuais (tema escuro como padrão, com arquitetura pronta para novos presets) com customização de cor de destaque, tipografia, estilo de bloco (cheio, contorno, vidro) e densidade
- 👁️ **Preview ao vivo** — veja exatamente como sua página pública vai ficar, em desktop e mobile, enquanto edita
- 📄 **Página pública responsiva** — layout em grid adaptativo que se ajusta de desktop a mobile mantendo hierarquia visual
- 📊 **Analytics de blocos** — visualizações, cliques, blocos mais usados, distribuição por tipo e detecção de oportunidades (blocos com muita visualização e pouco clique)
- 👥 **Audiência** — contatos capturados por blocos de formulário/newsletter, com exportação em CSV
- 📱 **QR Code** — geração automática de QR Code para a página pública
- ⚙️ **Gerenciamento de conta** — alteração de senha e exclusão de conta

### Em desenvolvimento (roadmap)
- 🧩 Templates prontos por objetivo (conseguir clientes, vender produtos, portfólio...) e por profissão
- 🎯 Smart Blocks — conteúdo condicional por origem de tráfego (Instagram, YouTube, LinkedIn, etc.)
- ⏰ Agendamento e expiração de blocos/links
- 🤖 GetLink AI — diagnóstico automático de otimização da página (observa → recomenda → aplica)
- 🧪 A/B Testing de blocos
- 💰 Monetização — produtos digitais, agendamento pago, domínio customizado, API pública

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite |
| Linguagem | TypeScript |
| Backend / Dados | Firebase (Auth, Firestore, Storage) |
| Estilo | CSS Modules / CSS Variables (design tokens para temas) |

## 🚀 Como rodar localmente

### Pré-requisitos
- Node.js 18 ou superior
- Uma conta e projeto criado no [Firebase Console](https://console.firebase.google.com/)

### 1. Clone o repositório

```bash
git clone https://github.com/Pedrin20/blockstack.git
cd blockstack
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as credenciais do seu projeto Firebase:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> Essas chaves estão disponíveis em **Configurações do projeto → Geral** no Firebase Console.

### 4. Ative os serviços necessários no Firebase

- **Authentication** (método de e-mail/senha)
- **Firestore Database**
- **Storage** (para upload de imagens de perfil, blocos e produtos)

### 5. Rode o projeto

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## 📂 Estrutura do projeto

```
getlink/
├── src/
│   ├── components/       # Componentes compartilhados (Card, Button, Input, EmptyState...)
│   ├── blocks/           # Tipos de bloco (Link, Produto, Serviço, Redes sociais, etc.)
│   ├── pages/            # Telas do dashboard (Minha Página, Design, Analytics, Audiência...)
│   ├── themes/           # Presets de tema e design tokens (CSS variables)
│   ├── firebase/         # Configuração e serviços do Firebase (auth, firestore, storage)
│   ├── hooks/            # Hooks customizados
│   └── types/            # Tipagens compartilhadas (Block, Theme, User...)
├── public/
├── .env
└── vite.config.ts
```

> Estrutura de referência — ajuste conforme a organização real do seu repositório.

## 🎨 Design System

O GetLink segue um design system único em todo o produto (dashboard e página pública), baseado em:
- **Tema escuro** como identidade padrão, com suporte a múltiplos presets
- **Tokens centralizados** via CSS variables (cor de destaque, radius, tipografia, sombras)
- **Componentes de bloco reutilizáveis** entre o editor e a renderização pública

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nome-da-feature'`)
4. Push para a branch (`git push origin feature/nome-da-feature`)
5. Abra um Pull Request

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

## 👤 Autor

Feito por **[Pedro]** — github.com/Pedrin20 · https://www.linkedin.com/in/pedro-henrique-alves-lessa-6920172aa/

---

<div align="center">

Se esse projeto te ajudou de alguma forma, considere deixar uma ⭐

</div>
