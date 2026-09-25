# Colobus — Loja de Calçados

Aplicação web/mobile de e-commerce de calçados, com backend próprio, banco de dados SQLite, autenticação JWT e integração com o Mercado Pago.

## Tecnologias

**Backend**
- Node.js + Express
- SQLite (better-sqlite3)
- JWT (jsonwebtoken) para autenticação
- bcryptjs para hash de senhas
- dotenv para variáveis de ambiente

**Frontend**
- React Native + Expo (modo web)
- React Navigation (stack)
- Context API (Auth + Carrinho + Alerta)
- Fonte Montserrat (@expo-google-fonts/montserrat)

**Integrações**
- Mercado Pago (Checkout Pro)

## Estrutura do projeto

```
Colobus/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuração do banco
│   │   ├── db/             # Schema SQL e seed
│   │   ├── middleware/     # Auth e tratamento de erros
│   │   ├── models/         # User, Product, Cart, Order
│   │   ├── routes/         # auth, cart, orders, payments, products, users
│   │   ├── services/       # Regras de negócio (orderService)
│   │   ├── utils/          # Erros customizados
│   │   ├── app.js
│   │   └── server.js
│   ├── data/               # Banco de dados (gerado, não versionado)
│   ├── .env.example
│   └── package.json
│
└── ecommerce/
    ├── assets/             # Ícones e splash
    ├── *.js                # Telas e contexts
    ├── App.js
    ├── api.js
    ├── app.json
    ├── .env.example
    └── package.json
```

## Como rodar o projeto

### Pré-requisitos
- Node.js 18+
- npm

### 1. Clonar o repositório
```bash
git clone <URL_DO_REPOSITORIO>
cd Colobus
```

### 2. Configurar o backend
```bash
cd backend
cp .env.example .env
npm install
node src/db/seed.js
npm run dev
```

O backend sobe em http://localhost:3000

### 3. Configurar o frontend (em outro terminal)
```bash
cd ecommerce
cp .env.example .env
npm install
npx expo start --web
```

O app abre em http://localhost:8081

## Credenciais padrão

| Tipo | E-mail | Senha |
|------|--------|-------|
| Administrador geral | admin@gmail.com | admin |

O banco vem com 12 calçados cadastrados e nenhum cliente. Crie uma conta pela tela de cadastro para testar o fluxo de compra.

## Funcionalidades

- Cadastro e login de usuários (JWT)
- Catálogo de calçados com busca por nome, marca ou numeração
- Carrinho de compras (adicionar, remover, alterar quantidade)
- Checkout com Mercado Pago (Checkout Pro — modo teste por padrão)
- Histórico de pedidos do cliente
- Painel administrativo:
  - Cadastro, edição e exclusão de produtos
  - Listagem de usuários
  - Gestão de pedidos e alteração de status

## Status dos pedidos

pendente → processando → preparando → em_rota → entregue (ou cancelado)

## Observações

- O arquivo `data/colobus.db` não é versionado. Ele é recriado ao rodar `node src/db/seed.js`.
- O arquivo `.env` não é versionado. Use o `.env.example` como modelo.
- O modo de pagamento padrão é mock (não cobra de verdade). Para usar produção, configure `MERCADOPAGO_ACCESS_TOKEN` real e ajuste o modo no backend.
