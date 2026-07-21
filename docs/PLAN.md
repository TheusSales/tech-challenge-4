# Tech Challenge 4 — Mobile Blog (React Native) + Backend extension

## Context

A Fase 4 do Postech pede um app **React Native** que consuma a API de blog criada nas fases anteriores. O objetivo é replicar (e ampliar para mobile) o admin de posts do TC3, cobrindo login de professores, CRUDs de posts/professores/alunos e autorização por papel.

**Problema:** o backend TC2 hoje só expõe CRUD público de Posts — não tem auth, professores nem alunos. Sem esses endpoints o app mobile não fecha o requisito. Decisão do usuário: **estender o backend TC2 in-place** (novos commits em `TheusSales/8fsdt-tech-challenge-2`) e criar um **repo novo `TheusSales/tech-challenge-4`** para o app Expo. Commits **sem co-autoria do Claude**.

**Stack decidida:** Expo (managed) + TypeScript + React Navigation (native-stack + bottom-tabs) + Redux Toolkit + RTK Query + `expo-secure-store` para JWT. Só professores logam; alunos navegam anônimos pelos posts públicos.

---

## Parte A — Backend (estender `~/Projetos/8fsdt-tech-challenge-2`)

### A1. Novos arquivos
- `src/middlewares/auth.ts` — `requireAuth` (lê `Authorization: Bearer`, valida JWT, injeta `req.professor`).
- `src/utils/jwt.ts` (`signToken`, `verifyToken`), `src/utils/password.ts` (bcryptjs cost 10), `src/utils/pagination.ts` (`?page&pageSize` → `{limit, offset}`).
- `src/models/professor.ts`, `src/models/student.ts` (mesmo padrão de `models/post.ts`).
- `src/controllers/auth.ts`, `src/controllers/professor.ts`, `src/controllers/student.ts`.
- `src/routes/auth.ts`, `src/routes/professor.ts`, `src/routes/student.ts`.
- `src/scripts/schema.sql` (DDL abaixo) e `src/scripts/seed.ts` (professor default `admin@fiap.com / admin123`, 2 alunos, 2 posts — idempotente com `ON CONFLICT`).

`src/server.ts`: apenas adicionar `app.use('/auth', ...)`, `app.use('/professors', ...)`, `app.use('/students', ...)`. `src/routes/post.ts` ganha `requireAuth` nas rotas de escrita + nova rota `GET /posts/admin?page&pageSize` (paginada, autenticada).

### A2. Schema (executar `psql < src/scripts/schema.sql` uma vez)
```sql
CREATE TABLE IF NOT EXISTS professors (
  id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE, ra VARCHAR(40),
  created_at TIMESTAMP DEFAULT NOW()
);
```
`posts.autor` continua como string livre (não vira FK — evita quebrar TC3 web e simplifica o card).

### A3. Endpoints novos (todos JSON; erros como `{message}`; created/updated em envelope `{message, resource}` como o pattern já existente em `controllers/post.ts:57`)
- **Auth**: `POST /auth/login` `{email,password}` → `{token, professor:{id,name,email}}`; `GET /auth/me` (requireAuth) → professor atual. Sem `/auth/register` — cadastro via `POST /professors`.
- **Professors** (todos requireAuth): `GET /professors?page=1&pageSize=20` → `{items,page,pageSize,total}`; `GET /:id`; `POST` `{name,email,password}`; `PUT /:id`; `DELETE /:id` (409 se tentar deletar a si mesmo).
- **Students** (todos requireAuth): mesmo shape, sem password (`{name,email,ra?}`).
- **Posts**: `POST/PUT/DELETE` ganham `requireAuth`; adicionar `GET /posts/admin?page&pageSize` (paginado, requireAuth) para a tela admin; rotas públicas atuais permanecem intocadas.

### A4. Deps novas
`npm i bcryptjs jsonwebtoken` + `npm i -D @types/bcryptjs @types/jsonwebtoken`. `dotenv` já existe. Novo script `"seed": "ts-node src/scripts/seed.ts"`. `.env.example` ganha `JWT_SECRET=changeme`.

### A5. Testes (Jest + supertest, seguindo o mock de `tests/controllers/post.test.ts`)
- `tests/controllers/auth.test.ts` — login OK, senha errada 401, `/auth/me` sem token 401 / com token 200.
- `tests/controllers/professor.test.ts` e `student.test.ts` — CRUD + paginação + email único (409) + delete-self bloqueado.
- Atualizar `tests/routes/post.test.ts` para injetar header fake nas rotas protegidas.

---

## Parte B — Mobile (`~/Projetos/tech-challenge-4` → `TheusSales/tech-challenge-4`)

### B1. Bootstrap
```bash
npx create-expo-app@latest tech-challenge-4 -t expo-template-blank-typescript
cd tech-challenge-4
npx expo install react-native-screens react-native-safe-area-context expo-secure-store
npm i @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm i @reduxjs/toolkit react-redux react-hook-form
```
`react-hook-form` para formulários (mais leve que Formik+Yup). Sem UI kit — portar os tokens de `~/Projetos/tech-challenge-3/src/styles/theme.ts` para `src/theme/index.ts` e escrever `Button`/`TextField`/`Card` à mão. `Alert.alert` do RN para confirmação de delete (evita ConfirmDialog custom no MVP).

### B2. Estrutura `src/`
```
api/         baseQuery.ts, postsApi.ts, professorsApi.ts, studentsApi.ts, authApi.ts
store/       index.ts (configureStore), authSlice.ts, hydrate.ts (thunk que lê SecureStore no boot)
navigation/  RootNavigator, AuthStack, AppTabs, PostsStack, AdminStack, types.ts
screens/     PostList, PostDetail, Login, AdminHome, PostForm, ProfessorsList,
             ProfessorForm, StudentsList, StudentForm
components/  Button, TextField, Card, ListItem, EmptyState, LoadingView, ErrorView, Header
hooks/       useDebounce (portar verbatim de ~/Projetos/tech-challenge-3/src/hooks/useDebounce.ts), useAuth
theme/       index.ts (colors/spacing/typography portados do TC3)
types/       post.ts (idpost, titulo, conteudo, autor, datacriacao — pt-BR igual TC3),
             professor.ts, student.ts, auth.ts
utils/       validators.ts, formatDate.ts
App.tsx      Provider(store) → NavigationContainer → RootNavigator; dispara hydrate no mount
```

### B3. Auth flow
- `baseQuery = fetchBaseQuery({ baseUrl: process.env.EXPO_PUBLIC_API_URL, prepareHeaders: (h, {getState}) => { const t = getState().auth.token; if(t) h.set('authorization', `Bearer ${t}`); return h } })`.
- Wrapper `baseQueryWithReauth`: em 401 → `dispatch(logout())` + `SecureStore.deleteItemAsync('token')` (RootNavigator troca para AuthStack sozinho).
- Login: `authApi.useLoginMutation` → `setCredentials({token, professor})` + `SecureStore.setItemAsync('token', token)`.
- Boot: thunk `hydrate` lê token do SecureStore; se existe, chama `useMeQuery` para validar; falha limpa storage.
- `RootNavigator`: sempre monta PostsStack (posts são públicos). AdminTab aparece só quando `token` está presente.

### B4. Telas → mapeamento com o PDF
| # PDF | Screen | Rota | Hooks |
|---|---|---|---|
| 1 | PostList | `PostList` | `useDebounce(q,300)` + `useSearchPostsQuery(dq,{skip:!dq})` ou `useListPostsQuery()` |
| 2 | PostDetail | `PostDetail` (`{id}`) | `useGetPostQuery(id)` |
| 3/4 | PostForm | `PostForm` (`{id?}`) | `useGetPostQuery` + `useCreatePostMutation`/`useUpdatePostMutation` |
| 5/6/7 | Professor* | `ProfessorsList`, `ProfessorForm` | list paginada em `FlatList` com `onEndReached`; form usa create/update mutations |
| 8 | Student* | `StudentsList`, `StudentForm` | espelho de professores, sem password |
| 9 | AdminHome | `AdminHome` | `useAdminListPostsQuery({page})` + delete com `Alert.alert` |
| 10 | Login | `Login` | `useLoginMutation` |

### B5. Env
`.env` na raiz com `EXPO_PUBLIC_API_URL=http://localhost:3000`. README documenta:
- iOS simulator → `http://localhost:3000`
- Android emulator → `http://10.0.2.2:3000`
- Device físico via Expo Go → `http://<LAN-IP>:3000` ou `npx expo start --tunnel`

### B6. README (obrigatório pelo PDF)
Prereqs, install, running (`npx expo start` + `i`/`a`/QR), env vars (tabela plataforma × URL), estrutura de pastas, diagrama de arquitetura (Screens → RTK Query → baseQuery → REST → Postgres), fluxo de auth, testes (`npm test` cobrindo `authSlice` reducer + smoke da LoginScreen com RNTL), seção "desafios da equipe", link do vídeo demo.

---

## Parte C — Ordem de execução (checkpoints, cada um = 1 commit)

### Progresso

| CP | Status | Commit |
|---|---|---|
| CP0 — seed do repo mobile | ✅ concluído | `31de80d` (tech-challenge-4) |
| CP1 — deps + scaffold de auth | ✅ concluído | `be515ff` (backend) |
| CP2 — auth JWT + seed | ✅ concluído | `a277817` (backend) |
| CP3 — professores + posts protegidos | ✅ concluído | `b25b3f5` (backend) |
| CP4 — alunos | ✅ concluído | `3890c0e` (backend) |
| — correção do seed | ✅ concluído | `dc36d89` (backend) |
| CP5 — bootstrap Expo | ⬜ **próximo** | — |
| CP6–CP12 | ⬜ pendentes | — |

**Backend concluído e publicado** em `TheusSales/8fsdt-tech-challenge-2` (branch `main`). 77 testes verdes, CI do GitHub Actions passando. Todos os endpoints da Parte A foram validados contra um Postgres real — ver "Estado verificado" abaixo.

### Desvios em relação ao plano original

Registrados porque afetam quem for retomar o trabalho:

- **`@types/bcryptjs` não é usado.** O `bcryptjs` v3 já traz os próprios tipos; o pacote `@types/bcryptjs` virou um stub vazio e foi removido.
- **`schema.sql` inclui a tabela `posts`**, não só `professors`/`students`. O repositório não versionava DDL nenhuma, então o script cria o banco inteiro do zero. A definição de `posts` espelha a tabela que já existia (`varchar(150)`/`varchar(100)`, `DEFAULT CURRENT_TIMESTAMP`).
- **`src/types/express.d.ts`** foi criado (não estava no plano) para tipar `req.professor` injetado pelo `requireAuth`.
- **Bug corrigido no seed:** o `INSERT ... SELECT` com `WHERE NOT EXISTS` reutiliza `$1` em dois contextos e o Postgres recusava o parâmetro (`text` vs `varchar`). Exigiu casts explícitos. **Os testes não pegaram isso** porque mockam os models — lição a levar para o mobile: validar SQL com o banco de pé.
- **`app.use(cors())`** estava pendente no working tree do backend e entrou junto no CP2; é necessário para o app mobile consumir a API.

### Estado verificado (contra Postgres real, não mock)

Login com `admin@fiap.com` / `admin123`; senha errada → 401; `/auth/me`, `/professors`, `/students` e `/posts/admin` paginados; CRUD de professor com e-mail duplicado → 409 e auto-exclusão → 409; update de professor **sem** senha preserva a senha atual (login segue funcionando); CRUD de aluno com `ra` opcional; create/edit/delete de post autenticado; leitura pública sem token → 200; escrita sem token → 401. Seed rodado duas vezes seguidas sem duplicar dados.

---

**CP0 — Seed do repo mobile** ✅
1. `mkdir -p ~/Projetos/tech-challenge-4/docs`
2. Copiar este arquivo de plano para `~/Projetos/tech-challenge-4/docs/PLAN.md`.
3. Criar `README.md` mínimo apontando para `docs/PLAN.md` + status "planning".
4. Criar `.gitignore` (Node + Expo + macOS/Linux).
5. `git init && git add . && git commit -m "docs: initial plan for Tech Challenge 4 mobile app"` — **sem** trailer `Co-Authored-By: Claude`.
6. `gh repo create TheusSales/tech-challenge-4 --public --source=. --remote=origin --push`.

Backend primeiro (mobile bloqueia nele).

1. **CP1** ✅ — deps + scaffold (`middlewares/`, `utils/`, `scripts/schema.sql`, `.env.example`). `chore: add auth utilities scaffolding`.
2. **CP2** ✅ — models/controllers/routes de auth + seed + testes de auth. `feat: JWT auth with professor login`.
3. **CP3** ✅ — Professors CRUD + `requireAuth` nos posts write + `GET /posts/admin` + testes. `feat: professors CRUD and protected post writes`.
4. **CP4** ✅ — Students CRUD + testes. `feat: students CRUD`. Push do backend.
5. **CP5** ⬅️ **próximo** — bootstrap Expo, store, navegadores vazios, theme portado, `useDebounce` portado, RTK Query base com Bearer. Primeiro push do app. `chore: bootstrap Expo app`.
   > O repo já existe e já tem `README.md`, `docs/` e `.gitignore`. O `create-expo-app` espera diretório vazio — gerar em pasta temporária e **mesclar**, preservando o README e o `docs/`, e fundindo o `.gitignore` do Expo com o atual em vez de substituí-lo.
6. **CP6** — `authSlice`, `authApi`, SecureStore + hydrate, `LoginScreen`, gate no RootNavigator. Testar contra backend seedado. `feat: professor login with JWT persistence`.
7. **CP7** — `PostListScreen` (busca com debounce) + `PostDetailScreen` + componentes base (`ListItem`, `Card`, `EmptyState`, `LoadingView`, `ErrorView`). `feat: post list and detail`.
8. **CP8** — `AdminHomeScreen` + `PostFormScreen` (create+edit) + delete com `Alert.alert`. `feat: admin posts management`.
9. **CP9** — `ProfessorsListScreen` (FlatList paginada) + `ProfessorFormScreen`. `feat: professors screens`.
10. **CP10** — `StudentsListScreen` + `StudentFormScreen`. `feat: students screens`.
11. **CP11** — README + arquitetura + polimento (error boundary, 401 auto-logout QA). `docs: README and architecture`.
12. **CP12** — gravar vídeo ≤15 min (roteiro: browse anônimo → login → admin CRUDs → logout → mostrar 401 handling → mostrar README).

Regra em todos os commits (backend e mobile): **sem trailer `Co-Authored-By: Claude`**.

---

## Parte D — Verificação end-to-end

### Requisitos da máquina de desenvolvimento

- **Node 20+** para o app Expo (o backend roda a partir do 18). Se o sistema tiver uma versão antiga vinda do apt, instalar via nvm — não precisa de `sudo` e não substitui o Node do sistema:
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash
  # reabra o terminal, então:
  nvm install --lts && nvm alias default 'lts/*'
  ```
  Em terminais já abertos o zsh pode continuar servindo o Node antigo do cache — `rehash` resolve.
- **Docker** com o container do Postgres de pé (`docker compose up -d` na pasta do backend). Em WSL, exige a integração com o WSL ativada nas configurações do Docker Desktop.
- **`.env` do backend** criado a partir do `.env.example`, com `JWT_SECRET` preenchido. O `.env` não é versionado, então precisa ser recriado em cada máquina.

**Backend** (`~/Projetos/8fsdt-tech-challenge-2`) — ✅ verificado:
1. `docker compose up -d`
2. `docker exec -i postgres_blog psql -U postgres -d blog_tech < src/scripts/schema.sql`
3. `npm run seed` → cria professor admin (idempotente)
4. `npm test` → 77 testes verdes
5. `npm run dev` → `http://localhost:3000`
6. Smoke:
   ```
   curl -sX POST localhost:3000/auth/login -H 'content-type: application/json' \
        -d '{"email":"admin@fiap.com","password":"admin123"}'   # → {token, professor}
   TOKEN=<colar>
   curl -s localhost:3000/professors -H "authorization: Bearer $TOKEN"   # → paginado
   curl -s localhost:3000/posts                                          # → 200 (público)
   curl -sX POST localhost:3000/posts -H 'content-type: application/json' \
        -d '{"titulo":"x","conteudo":"y","autor":"z"}'                   # → 401
   # mesmo POST com Bearer → 201
   ```

**Mobile** (`~/Projetos/tech-challenge-4`):
1. `npm install`; garantir backend rodando; ajustar `EXPO_PUBLIC_API_URL` conforme plataforma.
2. `npx expo start` → abrir no Expo Go / emulador.
3. Walk-through: post list → busca com debounce → detalhe → Login (`admin@fiap.com / admin123`) → Admin CRUDs (posts/professores/alunos) → logout → AdminTab some.
4. Forçar 401 (mudar `JWT_SECRET` no backend e tentar ação) → app auto-desloga.
5. `npm test` (Jest + RNTL) — reducer do authSlice + render smoke do LoginScreen.

Ambos verdes → tag `v1.0.0` nos dois repos, gravar demo, entregar URLs + vídeo.

---

## Arquivos de referência (para copiar/portar em vez de reinventar)
- Padrão HTTP + envelope: `~/Projetos/tech-challenge-3/src/services/api.ts` e `posts.ts`
- Hook de busca: `~/Projetos/tech-challenge-3/src/hooks/useDebounce.ts`
- Tokens visuais: `~/Projetos/tech-challenge-3/src/styles/theme.ts`
- Padrão de mock em testes backend: `~/Projetos/8fsdt-tech-challenge-2/tests/controllers/post.test.ts`
- Modelo/controlador de referência: `~/Projetos/8fsdt-tech-challenge-2/src/models/post.ts` e `src/controllers/post.ts`
