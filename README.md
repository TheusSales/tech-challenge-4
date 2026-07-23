# Tech Challenge 4 — Mobile Blog (React Native)

App mobile em **React Native (Expo + TypeScript)** para a plataforma de blogging construída nas fases anteriores do Postech FullStack.

> **Status:** `backend pronto — login implementado, demais telas em construção`
>
> A API já expõe tudo que o app precisa (auth JWT, professores, alunos, posts protegidos e paginados) e está publicada. O app Expo tem store, navegação, tema, camada de API e a tela de login prontos; as telas de posts e dos CRUDs são placeholders. Ver [`docs/PLAN.md`](docs/PLAN.md).

## Escopo

Interface mobile para docentes e alunos consumirem a API REST do blog:

- Lista de posts com busca por palavra-chave e leitura completa (público).
- Login de professores com JWT persistido em `expo-secure-store`.
- Área administrativa (professores autenticados): CRUDs de posts, professores e alunos.
- Autorização por papel: professores escrevem, alunos apenas leem.

Detalhes técnicos, endpoints, checkpoints e verificação end-to-end em [`docs/PLAN.md`](docs/PLAN.md).

## Stack

- **Expo SDK 57** (managed) + **TypeScript**, React Native 0.86
- **React Navigation 7** (native-stack + bottom-tabs)
- **Redux Toolkit** + **RTK Query**
- **expo-secure-store** (JWT), **react-hook-form** (formulários)

## Rodando o app

```bash
npm install
cp .env.example .env      # ajuste EXPO_PUBLIC_API_URL conforme a plataforma
npx expo start            # depois: i (iOS), a (Android) ou QR code no Expo Go
```

O backend precisa estar de pé — ver a seção abaixo.

### `EXPO_PUBLIC_API_URL` por plataforma

| Onde o app roda | Valor |
|---|---|
| Simulador iOS | `http://localhost:3000` |
| Emulador Android | `http://10.0.2.2:3000` |
| Celular físico (Expo Go) | `http://<IP-da-máquina-na-LAN>:3000` |

`localhost` dentro do emulador Android aponta para o próprio emulador, não para a sua máquina — daí o `10.0.2.2`. Para celular físico, alternativa sem descobrir IP: `npx expo start --tunnel`.

## Estrutura

```
src/
  api/          RTK Query: baseQuery (Bearer + auto-logout em 401), um endpoint file por recurso
  store/        configureStore, authSlice, hydrate (restaura o token no boot)
  navigation/   RootNavigator → AppTabs → PostsStack | AdminStack | AuthStack
  screens/      uma tela por item do enunciado (placeholders até o CP6)
  components/   componentes base compartilhados
  hooks/        useDebounce (portado do TC3), useAuth + hooks tipados do Redux
  theme/        tokens de cor/spacing/tipografia portados do TC3
  types/        contratos espelhando as respostas do backend
```

### Fluxo de autenticação

`Login` → `useLoginMutation` → token no `authSlice` + `SecureStore`. Toda requisição passa pelo `prepareHeaders`, que injeta `Authorization: Bearer`. Qualquer resposta **401** dispara `logout()` e limpa o `SecureStore` — a aba "Admin" some sozinha e vira "Entrar", sem tratamento espalhado pelas telas. No boot, o `hydrateAuth` lê o token guardado e confirma com `GET /auth/me` antes de considerar a sessão válida.

### Verificação

```bash
npm test             # 46 testes (jest-expo + React Native Testing Library)
npm run typecheck    # tsc --noEmit
```

Os testes cobrem o `authSlice`, os validadores, a tradução de erro da API, o `useDebounce` e — o mais importante — o fluxo de autenticação inteiro contra um `fetch` mockado: injeção do Bearer, logout automático no 401, restauração da sessão no boot e a tela de login ponta a ponta. As respostas mockadas foram copiadas de chamadas reais ao backend seedado, então uma mudança de contrato quebra os testes.

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
4. **Suba o app** (`npm install && cp .env.example .env && npx expo start`) e siga o **CP6** em [`docs/PLAN.md`](docs/PLAN.md).

## Próximos passos

Ver `docs/PLAN.md`, seção **Parte C — Ordem de execução**. CP0–CP5 concluídos; CP6–CP12 pendentes.
