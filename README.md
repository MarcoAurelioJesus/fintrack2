# FinTrack - Financial Management Application

> Uma aplicação full stack moderna de controle financeiro pessoal, construída com Angular 20+ e Tailwind CSS.

![Angular](https://img.shields.io/badge/Angular-20.0-red?style=for-the-badge&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## 📋 Índice

- [Sobre](#sobre)
- [Features](#features)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Arquitetura](#arquitetura)
- [Stack Tecnológico](#stack-tecnológico)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Testes](#testes)
- [Contribuição](#contribuição)

## 📱 Sobre

**FinTrack** é uma aplicação web responsiva para gerenciamento financeiro pessoal. Com ela, você pode:

- 💰 Controlar entradas e saídas de forma simples
- 📊 Acompanhar seu saldo em tempo real
- 📈 Visualizar relatórios e gráficos detalhados
- 🗂️ Organizar transações por categorias personalizadas
- 📅 Agendar transações futuras
- 🎨 Personalizar categorias com cores

O projeto foi desenvolvido seguindo princípios **SOLID**, **clean architecture** e **best practices** modernas de desenvolvimento full stack.

## ✨ Features

### Dashboard
- **Visão geral financeira**: Saldo atual, entradas e saídas do mês
- **Gráficos interativos**: Visualização de saldo ao longo do tempo e distribuição por categoria
- **Filtros dinâmicos**: Filtre dados por categoria
- **Botão de atualização**: Sincronize dados em tempo real

### Transações
- **CRUD completo**: Criar, ler, atualizar e deletar transações
- **Filtros avançados**: Por categoria e tipo (entrada/saída)
- **Agendamento**: Marque transações futuras
- **Detalhes expandidos**: Visualize informações completas de cada transação
- **Tabela responsiva**: Interface otimizada para desktop e mobile

### Categorias
- **Gerenciamento de categorias**: CRUD completo
- **Personalização visual**: Escolha cores para cada categoria
- **Favoritos**: Destaque categorias mais usadas
- **Busca**: Procure categorias por nome

## 🔧 Requisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**

## 📥 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/MarcoAurelioJesus/fintrack2.git
cd fintrack2
```

### 2. Instale as dependências

```bash
# Frontend
npm install

# Backend
npm --prefix backend install
```

### 3. Configure o banco de dados (opcional)

Para usar dados de demonstração:

```bash
npm run seed:demo
```

## 🚀 Como Usar

### Desenvolvimento

Inicie a aplicação em modo desenvolvimento (frontend + backend simultaneamente):

```bash
npm start
```

Isso abrirá:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000

### Build para Produção

```bash
npm run build:prod
```

Os arquivos serão gerados em `dist/fintrack/`.

## 📝 Scripts Disponíveis

### Frontend
| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia frontend e backend simultaneamente |
| `npm run start:proxy` | Inicia apenas o frontend com proxy |
| `npm run start:api` | Inicia apenas o backend |
| `npm run build` | Build para desenvolvimento |
| `npm run build:prod` | Build para produção |
| `npm run watch` | Recompila em modo watch |
| `npm run test:unit` | Executa testes unitários |
| `npm run test:all` | Executa todos os testes (frontend + backend) |
| `npm run lint` | Verifica linting com ESLint |

### Backend
| Comando | Descrição |
|---------|-----------|
| `npm --prefix backend run dev` | Inicia servidor em modo watch |
| `npm --prefix backend run start` | Inicia servidor |
| `npm --prefix backend run seed:demo` | Popula banco com dados de demonstração |
| `npm --prefix backend run test` | Executa testes do backend |

## 🏗️ Arquitetura

### Padrão de Arquitetura

O projeto segue **Feature-Based Module Architecture** com separação clara entre:

```
src/app/
├── core/          # Serviços singleton, guards, interceptadores
├── shared/        # Componentes, directives, pipes reutilizáveis
└── features/      # Módulos de features (Dashboard, Transactions, Categories)
```

### Smart & Dumb Components

- **Smart Components** (containers): Gerenciam estado e lógica
- **Dumb Components** (presentacionais): Apenas recebem e exibem dados

### Gerenciamento de Estado

Utiliza **RxJS Observables** com service-based state management, fornecendo:
- Reatividade eficiente
- Separação de responsabilidades
- Código limpo e testável

## 💻 Stack Tecnológico

### Frontend
| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **Angular** | 20.0 | Framework principal |
| **TypeScript** | 5.9 | Tipagem estática |
| **RxJS** | 7.8 | Programação reativa |
| **PrimeNG** | 20.0 | Componentes UI prontos |
| **Tailwind CSS** | 3.4 | Estilização utilitária |
| **Chart.js** | 4.5 | Gráficos interativos |
| **Vitest** | 2.1 | Testes unitários |

### Backend
| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **Express.js** | 4.21 | Framework HTTP |
| **Node.js** | 18+ | Runtime JavaScript |
| **PostgreSQL** | - | Banco de dados |
| **CORS** | 2.8 | Controle de origem cruzada |
| **Vitest** | 2.1 | Testes |

### DevOps & Ferramentas
- **Concurrently**: Executar múltiplos processos simultaneamente
- **PostCSS + Autoprefixer**: Pós-processamento de CSS
- **Angular CLI**: Build e desenvolvimento
- **ESLint**: Linting de código

## 📂 Estrutura do Projeto

```
fintrack/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── i18n/               # Labels da aplicação
│   │   │   ├── models/             # Interfaces TypeScript
│   │   │   ├── services/           # Serviços de domínio
│   │   │   │   ├── dashboard.service.ts
│   │   │   │   ├── transaction.service.ts
│   │   │   │   └── category.service.ts
│   │   │   └── utils/              # Utilitários
│   │   ├── features/
│   │   │   ├── dashboard/          # Módulo Dashboard
│   │   │   ├── transactions/       # Módulo Transações
│   │   │   └── categories/         # Módulo Categorias
│   │   ├── shared/
│   │   │   └── components/         # Componentes reutilizáveis
│   │   └── app.routes.ts           # Rotas da aplicação
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── backend/
│   ├── src/
│   │   ├── db.js                   # Configuração do banco
│   │   ├── schema.js               # Definição das tabelas
│   │   ├── server.js               # Servidor Express
│   │   └── utils/                  # Utilitários
│   ├── test/                       # Testes unitários
│   └── scripts/                    # Scripts de setup
├── docs/
│   ├── documentacao-tecnica-completa.md
│   └── plano-testes-prova-tce.md
├── angular.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── proxy.conf.json
└── README.md
```

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários (frontend)
npm run test:unit

# Testes do backend
npm --prefix backend run test

# Todos os testes
npm run test:all
```

### Cobertura de Testes

O projeto inclui testes para:
- **Serviços**: Lógica de negócio e chamadas HTTP
- **Componentes**: Renderização e interações
- **Utilitários**: Funções auxiliares
- **Backend**: API endpoints e esquema

## 🔒 Segurança e Boas Práticas

✅ **TypeScript strict mode** para segurança de tipos
✅ **Separação de responsabilidades** (SOLID)
✅ **Componentes reutilizáveis** (DRY)
✅ **Validação de formulários** reativos
✅ **CORS** configurado no backend
✅ **Tratamento de erros** em camadas

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Guia de Desenvolvimento

- Siga as convenções de naming do projeto
- Mantenha componentes pequenos e focados
- Adicione testes para novas funcionalidades
- Atualize documentação conforme necessário

## 📊 Roadmap

- [ ] Autenticação e autorização de usuários
- [ ] Sincronização com banco de dados em tempo real
- [ ] App mobile nativa (React Native)
- [ ] Integração com instituições bancárias
- [ ] Relatórios avançados em PDF/Excel
- [ ] Sistema de notificações
- [ ] Modo offline com sincronização

## 📄 Documentação Adicional

Para mais detalhes técnicos, consulte:
- [Documentação Técnica Completa](./docs/documentacao-tecnica-completa.md)
- [Plano de Testes](./docs/plano-testes-prova-tce.md)

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](./LICENSE) para detalhes.

## 👨‍💻 Autor

Desenvolvido por **Marco Aurélio Jesus**

## 📞 Suporte

Para dúvidas ou sugestões, abra uma [issue](https://github.com/MarcoAurelioJesus/fintrack2/issues) no repositório.

---

<div align="center">

**[⬆ Voltar ao topo](#fintrack---financial-management-application)**

Made with ❤️ by Marco Aurélio Jesus

</div>
