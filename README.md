# Tech Challenge 4 — Mobile Blog (React Native)

App mobile em **React Native (Expo + TypeScript)** para a plataforma de blogging construída nas fases anteriores do Postech FullStack.

> **Status:** `planning` — repositório semeado apenas com o plano de implementação. O desenvolvimento continuará em outra máquina a partir deste ponto.

## Escopo

Interface mobile para docentes e alunos consumirem a API REST do blog:

- Lista de posts com busca por palavra-chave e leitura completa (público).
- Login de professores com JWT persistido em `expo-secure-store`.
- Área administrativa (professores autenticados): CRUDs de posts, professores e alunos.
- Autorização por papel: professores escrevem, alunos apenas leem.

Detalhes técnicos, endpoints, checkpoints e verificação end-to-end em [`docs/PLAN.md`](docs/PLAN.md).

## Stack planejada

- **Expo** (managed) + **TypeScript**
- **React Navigation** (native-stack + bottom-tabs)
- **Redux Toolkit** + **RTK Query**
- **expo-secure-store** (JWT), **react-hook-form** (formulários)

## Backend

O app consome a API do repositório [`TheusSales/8fsdt-tech-challenge-2`](https://github.com/TheusSales/8fsdt-tech-challenge-2), que será estendido nesta fase com endpoints de auth (JWT), professores e alunos — ver Parte A do plano.

## Próximos passos

Ver `docs/PLAN.md` seção **Parte C — Ordem de execução**. CP0 (semear repo com plano) já feito; CP1–CP12 pendentes.
