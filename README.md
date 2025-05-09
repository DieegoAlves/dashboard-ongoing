# Dashboard Ongoing

Dashboard Ongoing é uma aplicação **Next.js + TypeScript** para clientes da **ON•GOING Disco** acompanharem suas horas contratadas/mensais e para administradores gerirem usuários e tarefas.

![Screenshot](docs/dashboard.png)

## Índice
- [Funcionalidades](#funcionalidades)
- [Stack Tecnológica](#stack-tecnológica)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Projeto](#configuração-do-projeto)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts NPM](#scripts-npm)
- [Banco de Dados](#banco-de-dados)
- [Testes](#testes)
- [Deploy](#deploy)

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| Autenticação | Login JWT, controle de sessão, papéis **admin**/**client** |
| Dashboard do Cliente | Horas do mês, saldo acumulado de meses anteriores, histórico de tarefas |
| Admin | CRUD de usuários, gestão de tarefas (integração ClickUp), relatórios de horas |

## Stack Tecnológica

- **Next.js 15** + **React 19**
- **TypeScript 5**
- **Material-UI (MUI)**
- **Prisma ORM** com **SQLite** (DEV)  
   a0↳ fácil migração para Postgres/MySQL em produção
- **JWT** para autenticação

## Pré-requisitos

- **Node.js** >= 18
- **npm** >= 9 (ou **pnpm**/ **yarn**)

## Configuração do Projeto

```bash
# clone o repo
$ git clone git@github.com:DieegoAlves/dashboard-ongoing.git && cd dashboard-ongoing

# instale as dependências
$ npm install

# configure variáveis de ambiente
$ cp .env.example .env    # edite valores conforme necessidade

# execute as migrações Prisma (gera banco SQLite)
$ npx prisma migrate dev --name init

# rode em modo desenvolvimento
$ npm run dev
```

A aplicação estará disponível em **http://localhost:3000**.

## Variáveis de Ambiente

| Variável | Exemplo | Observação |
|----------|---------|------------|
| `DATABASE_URL` | `file:./dev.db` | Para produção use URL do seu banco (Postgres, MySQL, etc.) |
| `JWT_SECRET` | `supersecretkey` | Chave para assinar tokens |

> Para facilitar, há um arquivo `.env.example` com todas as chaves necessárias.

## Scripts NPM

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Next.js dev server com hot-reload |
| `npm run build` | Compila aplicação para produção |
| `npm start` | Inicia o servidor Node em produção |
| `npm test` | (placeholder) executa testes |

## Banco de Dados

- Migrations residem em `prisma/migrations/`.
- Para abrir o **Prisma Studio**:

  ```bash
  npx prisma studio
  ```

## Testes

Integração com **Jest** ou **Vitest** pode ser adicionada futuramente. Arquitetura pronta para incluir testes unitários e de integração.

## Deploy

- **Vercel**: zero-config (Next.js)  
- **Docker**: basta copiar os artefatos de build (`next build && next start`).
