# Tech Challenge 4 — Mobile Blog (React Native)

App mobile em **React Native (Expo + TypeScript)** para a plataforma de blogging construída nas fases anteriores do Postech FullStack.

> **Status:** `backend pronto — app mobile não iniciado`
>
> A API já expõe tudo que o app precisa (auth JWT, professores, alunos, posts protegidos e paginados) e está publicada. O próximo passo é o **CP5: bootstrap do projeto Expo**. Ver [`docs/PLAN.md`](docs/PLAN.md).

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

O app consome a API do repositório [`TheusSales/8fsdt-tech-challenge-2`](https://github.com/TheusSales/8fsdt-tech-challenge-2), **já estendida nesta fase** com:

| Recurso | Endpoints |
|---|---|
| Autenticação | `POST /auth/login`, `GET /auth/me` |
| Posts (público) | `GET /posts`, `GET /posts/:id`, `GET /posts/search?q=` |
| Posts (protegido) | `GET /posts/admin` (paginado), `POST`, `PUT /:id`, `DELETE /:id` |
| Professores | CRUD completo em `/professors`, paginado |
| Alunos | CRUD completo em `/students`, paginado |

Rotas protegidas exigem `Authorization: Bearer <token>`. Credenciais do seed: **`admin@fiap.com` / `admin123`**.

## Retomando o desenvolvimento em outra máquina

1. **Node 20+** (o Expo exige). Se o Node do sistema for antigo:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash
   # reabra o terminal
   nvm install --lts && nvm alias default 'lts/*'
   ```
2. **Suba o backend** (ele bloqueia o app):
   ```bash
   git clone https://github.com/TheusSales/8fsdt-tech-challenge-2
   cd 8fsdt-tech-challenge-2
   npm install
   cp .env.example .env          # preencha JWT_SECRET
   docker compose up -d
   docker exec -i postgres_blog psql -U postgres -d blog_tech < src/scripts/schema.sql
   npm run seed
   npm run dev                   # http://localhost:3000
   ```
3. **Confirme que a API responde** antes de mexer no app:
   ```bash
   curl -sX POST localhost:3000/auth/login -H 'content-type: application/json' \
        -d '{"email":"admin@fiap.com","password":"admin123"}'
   ```
4. **Siga o CP5** em [`docs/PLAN.md`](docs/PLAN.md) — atenção à nota sobre não deixar o `create-expo-app` sobrescrever este README e o `.gitignore`.

## Próximos passos

Ver `docs/PLAN.md`, seção **Parte C — Ordem de execução**. CP0–CP4 concluídos; CP5–CP12 pendentes.
