---
name: MVP Deu Jogo
overview: Sistema web para organização de dias de futebol com React, CSS Modules e Supabase. Foco em lista de presença, divisão de times, gestão de partidas com estatísticas e classificação em tempo real.
todos:
  - id: setup
    content: "Setup do projeto: Vite + React + Supabase client + estrutura de pastas"
    status: completed
  - id: database
    content: Criar tabelas no Supabase e configurar RLS e Realtime
    status: pending
  - id: home
    content: "Página Home: criar/continuar dia de jogo"
    status: pending
  - id: attendance
    content: Componente Lista de Presença com ordenação automática
    status: pending
  - id: teams
    content: Componente Divisão de Times com drag-and-drop
    status: pending
  - id: matches
    content: Componente Gestão de Partidas com placar e estatísticas
    status: pending
  - id: standings
    content: Componente Classificação em tempo real
    status: pending
  - id: polish
    content: Ajustes finais de UX e responsividade
    status: pending
---

# Plano de Desenvolvimento - Deu Jogo

**Stack:** React (Vite) + CSS Modules + Supabase

---

## Arquitetura Geral

```mermaid
flowchart TB
    subgraph frontend [Frontend - React]
        Pages[Pages]
        Components[Components]
        Hooks[Custom Hooks]
        Context[Supabase Context]
    end
    
    subgraph supabase [Supabase]
        Auth[Auth - futuro]
        DB[(PostgreSQL)]
        Realtime[Realtime Subscriptions]
    end
    
    Pages --> Components
    Components --> Hooks
    Hooks --> Context
    Context --> DB
    Context --> Realtime
    Realtime -->|"auto-sync"| Hooks
```

---

## Modelagem do Banco de Dados (Supabase)

```mermaid
erDiagram
    game_days ||--o{ attendance : has
    game_days ||--o{ teams : has
    game_days ||--o{ matches : has
    players ||--o{ attendance : registers
    teams ||--o{ team_players : contains
    players ||--o{ team_players : assigned
    matches ||--o{ match_stats : records
    players ||--o{ match_stats : has
    teams ||--o{ matches : plays_as_teamA
    teams ||--o{ matches : plays_as_teamB
    
    players {
        uuid id PK
        string name
        enum type "mensalista|avulso"
        timestamp created_at
    }
    
    game_days {
        uuid id PK
        date date UK
        enum status "scheduled|in_progress|finished"
        timestamp created_at
    }
    
    attendance {
        uuid id PK
        uuid game_day_id FK
        uuid player_id FK
        int arrival_order
        timestamp arrived_at
    }
    
    teams {
        uuid id PK
        uuid game_day_id FK
        string name
        int display_order
    }
    
    team_players {
        uuid id PK
        uuid team_id FK
        uuid player_id FK
        int number
        boolean is_captain
    }
    
    matches {
        uuid id PK
        uuid game_day_id FK
        uuid team_a_id FK
        uuid team_b_id FK
        int score_a
        int score_b
        int match_number
        enum status "pending|in_progress|finished"
    }
    
    match_stats {
        uuid id PK
        uuid match_id FK
        uuid player_id FK
        int goals
        int assists
        int yellow_cards
        int red_cards
    }
```

---

## Estrutura de Pastas

```
deu-jogo/
├── src/
│   ├── components/
│   │   ├── AttendanceList/
│   │   ├── TeamBuilder/
│   │   ├── MatchCard/
│   │   ├── Scoreboard/
│   │   ├── StandingsTable/
│   │   └── common/
│   ├── pages/
│   │   ├── Home/
│   │   └── GameDay/
│   ├── hooks/
│   │   ├── useGameDay.js
│   │   ├── useAttendance.js
│   │   ├── useTeams.js
│   │   └── useMatches.js
│   ├── services/
│   │   └── supabase.js
│   ├── context/
│   │   └── GameDayContext.js
│   └── styles/
│       └── global.css
├── .env
└── package.json
```

---

## Fluxo Principal da Aplicação

```mermaid
flowchart LR
    A[Home] -->|"Novo Dia / Continuar"| B[GameDay]
    B --> C[Lista de Presenca]
    B --> D[Divisao de Times]
    B --> E[Partidas]
    B --> F[Classificacao]
    
    C -->|"adiciona jogador"| C
    D -->|"arrastar jogador"| D
    E -->|"atualiza placar"| E
    E -->|"registra estatistica"| E
    F -->|"atualiza automatico"| F
```

---

## Etapas de Implementação

### 1. Setup Inicial

- Criar projeto React com Vite
- Configurar Supabase (projeto + client)
- Criar estrutura de pastas e CSS global com tema escuro/esportivo

### 2. Banco de Dados

- Criar tabelas no Supabase conforme modelagem
- Configurar Row Level Security (RLS) básico
- Habilitar Realtime nas tabelas principais

### 3. Página Home

- Botão "Iniciar Dia de Jogo" (cria com data atual, mas que pode ser modificada para criar jogo no passado ou futuro)
- Status do dia: `scheduled` (agendado), `in_progress` (em andamento), `finished` (encerrado)
- Lista de dias anteriores para continuar/visualizar. Podendo continuar apenas se status != `finished`

### 4. Lista de Presença

- De forma rápida, buscar jogador cadastrado ou cadastrar com nome + tipo.
- Ordenação automática: mensalistas primeiro, em ordem de chegar e depois por ordem de chegada dos avulsos
- Indicador visual do tipo de jogador.

### 5. Divisão de Times

- 4 times padrão (Time A, B, C, D)
- Adicionar/remover times
- Editar nome do time
- Arrastar jogadores da lista de presença para times
- Definir opcionalmente número e capitão
- **Histórico preservado:** Times são criados por dia (`game_day_id`), então o vínculo jogador-time persiste automaticamente no histórico mesmo após encerrar o dia

### 6. Gestão de Partidas

- Criar partida selecionando 2 times
- Atualizar placar em tempo real (botões +/-)
- Registrar estatísticas por jogador (gols, assistências, cartões)

- Tudo na mesma tela e em tempo real
- Status da partida (pendente, em andamento, finalizada)

### 7. Classificação

- Tabela com pontos, vitórias, empates, derrotas, saldo de gols, número de cartões
- Atualização automática via Realtime do Supabase

### 8. Auto-save

- Todas as operações salvam automaticamente no Supabase
- Feedback visual discreto de salvamento

---

## Identidade Visual - Champions League

- **Cores Principais:**
  - Azul Escuro (primária): `#1C2C5B`
  - Azul Noite (fundo): `#0A1128`
  - Branco (textos): `#FFFFFF`
  - Dourado (destaques/estrelas): `#D4AF37`
  - Cinza (secundário): `#6C757D`
- **Tipografia:** Bold para números/placares, clean para textos
- **Layout:** Cards para partidas, tabelas compactas, botões grandes para toque
- **Efeitos:** Gradientes sutis no fundo, bordas douradas em elementos de destaque