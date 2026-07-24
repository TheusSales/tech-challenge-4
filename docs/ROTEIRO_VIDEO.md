# Roteiro do vídeo de demonstração — CP12

**Duração alvo:** 12 minutos (o limite é 15; a folga cobre travadas e narração mais lenta).
**Formato:** captura de tela do app + narração. Não precisa aparecer no vídeo.

---

## Antes de gravar (checklist)

Um estado limpo e conhecido evita surpresa na hora. **Rode isto e não mexa mais nos dados até terminar de gravar:**

```bash
# 1. Backend de pé, com o banco reseedado
cd ~/Projetos/8fsdt-tech-challenge-2
docker compose up -d
docker exec -i postgres_blog psql -U postgres -d blog_tech < src/scripts/schema.sql
npm run seed          # recria admin@fiap.com / admin123, 2 alunos, 2 posts
npm run dev           # deixa rodando em http://localhost:3000

# 2. App em outro terminal
cd ~/Projetos/tech-challenge-4
npx expo start        # tecla w para o navegador, ou a/QR para dispositivo
```

Depois do seed, o estado é: **1 professor** (`admin@fiap.com`), **2 alunos** (Ana Souza, Bruno Lima), **2 posts** ("Bem-vindo ao blog da turma", "Como estudar React Native").

**Onde gravar — decida antes:**
- **Celular ou emulador** é o ideal: mostra o `expo-secure-store` de verdade, e o item 4 do roteiro (fechar e reabrir o app) só faz sentido lá. No WSL, use `networkingMode=mirrored` ou o port proxy — ver o README.
- **Navegador** funciona para tudo, menos a persistência real da sessão. Se gravar no navegador, no item 4 troque "feche e reabra o app" por "recarregue a aba" e mencione a ressalva do `localStorage`.

**Deixe aberto numa aba/janela:** o `README.md` no GitHub (para o fecho) e, se quiser, o VS Code com a estrutura de `src/`.

**Prepare um texto longo** para colar no teste de limite (item 3.3) — qualquer lorem ipsum com mais de 150 caracteres.

---

## Roteiro

### 0. Abertura — 30s

> "Este é o Tech Challenge da Fase 4: um app mobile em React Native que consome a API de blog das fases anteriores. Ele tem duas faces — uma área pública, onde qualquer aluno lê os posts sem login, e uma área administrativa, onde professores autenticados gerenciam posts, professores e alunos. Vou começar pela parte pública, como um aluno."

Mostre o app aberto na **lista de posts**.

---

### 1. Área pública (aluno anônimo) — 2min

**1.1 — Lista de posts.**
> "Esta é a tela inicial. Ela é pública: não pedi login para chegar aqui. Os posts vêm paginados da API."

Role a lista.

**1.2 — Busca com debounce.**
> "A busca é por palavra-chave. Repare que ela não dispara a cada tecla — espera eu parar de digitar. Isso é um debounce de 300 milissegundos, para não sobrecarregar a API."

Digite `react` devagar. Aparece "Como estudar React Native".

> "E quando nada corresponde ao termo, o app mostra um estado vazio claro, não um erro."

Digite algo sem resultado, tipo `xyz`. Mostre o "Nenhum post encontrado". Limpe a busca (o X).

**1.3 — Leitura do post.**
> "Toco no post para abrir a leitura completa: título, autor, data e conteúdo."

Abra "Bem-vindo ao blog da turma". Volte.

---

### 2. Login do professor — 1min30

**2.1 — Aba de acesso.**
> "Até agora naveguei sem conta. Para administrar, preciso entrar. A segunda aba, 'Entrar', leva ao login."

Vá para a aba de login.

**2.2 — Erro de credencial.**
> "Primeiro, de propósito, vou errar a senha, para mostrar o tratamento de erro."

Digite `admin@fiap.com` e uma senha errada. Mostre a mensagem **"E-mail ou senha inválidos."**

> "A mensagem é a que o backend retorna. Ela é a mesma para e-mail inexistente e senha errada — de propósito, para não revelar quais e-mails estão cadastrados."

**2.3 — Login correto.**
> "Agora com a senha certa: admin@fiap.com / admin123."

Entre. A aba **"Admin" aparece** e some a "Entrar".

> "Repare que a aba mudou sozinha para 'Admin'. Quem controla isso é a presença do token — nenhuma tela precisa saber disso."

---

### 3. CRUD de posts — 2min30

**3.1 — Painel.**
> "O painel administrativo lista os posts com o total publicado, e dá atalhos para professores e alunos."

**3.2 — Criar post.**
> "Vou criar um post novo. O autor já vem preenchido com o professor logado, mas é editável."

Toque em "Novo post". Preencha título e conteúdo. Publique. Ele aparece na lista.

**3.3 — Validação de limite (o diferencial).**
> "Um detalhe que vale mostrar: o título tem limite de 150 caracteres, que é o limite da coluna no banco. Se eu colar um texto gigante..."

Abra "Novo post", cole o texto longo no título.

> "...o campo para no limite e mostra um contador. Isso evita um erro que a versão antiga tinha: mandar texto grande demais e receber um erro genérico do servidor. Aqui o problema é barrado antes de sair do app."

Cancele.

**3.4 — Editar e excluir.**
> "Toco num post para editar."

Edite o título de um post. Salve.

> "E a exclusão pede confirmação, porque é irreversível."

Exclua o post que você criou. Confirme no diálogo. Ele some da lista.

---

### 4. Persistência da sessão — 1min

> _(Só faz sentido em celular/emulador. No navegador, adapte para "recarregar a aba" e cite a ressalva.)_

> "A sessão é persistida com segurança no dispositivo, no `expo-secure-store`. Para provar: vou fechar o app completamente e abrir de novo."

Feche e reabra o app.

> "Ele voltou direto para a área logada, sem pedir a senha de novo. No boot, o app recupera o token guardado e confirma com o backend se ele ainda vale antes de me deixar entrar."

---

### 5. CRUD de professores e alunos — 2min30

**5.1 — Professores.**
> "Pelos atalhos do painel, chego aos professores. Aqui estou eu, marcado com 'você'."

Abra a lista de professores.

> "Vou cadastrar um professor novo."

Crie um: nome, e-mail, senha. Salve.

> "E aqui uma regra de segurança: eu não posso excluir a mim mesmo."

Tente excluir a conta marcada "você". Mostre o erro **"Você não pode excluir o próprio usuário."**

> "Isso garante que o sistema nunca fique sem nenhum professor com acesso. Posso, sim, excluir outro professor."

Exclua o que você acabou de criar.

**5.2 — Alunos.**
> "Os alunos seguem o mesmo padrão, com um campo a mais, o RA, que é opcional."

Abra a lista de alunos. Crie um aluno **sem** preencher o RA.

> "Cadastrei sem RA. Na lista, a linha do RA simplesmente não aparece para ele — não fica um campo vazio sobrando."

Exclua-o.

---

### 6. Logout e revogação de acesso — 1min

**6.1 — Logout.**
> "Para sair, o botão no cabeçalho pede confirmação."

Toque em "Sair". Confirme. A aba volta a ser "Entrar".

> "E repare: continuo vendo os posts. A leitura é pública — sair só encerra a parte administrativa."

**6.2 — (Opcional, se sobrar tempo) — o 401 automático.**
> "Um cenário que o app trata sozinho: se o token expirar ou a conta for excluída enquanto estou logado, a próxima ação recebe um 401 do backend e o app desloga automaticamente, sem travar numa tela quebrada."

_(Difícil de encenar ao vivo; pode só narrar sobre o código, ou pular.)_

---

### 7. Fecho — código e README — 1min

Mostre o GitHub ou o VS Code.

> "Por baixo, o app é Expo com TypeScript, Redux Toolkit e RTK Query. Toda a autenticação está concentrada num único lugar: um wrapper que injeta o token em cada requisição e trata o 401 de sessão expirada — nenhuma tela lida com isso."

Mostre o diagrama de arquitetura do README.

> "O projeto tem 142 testes automatizados cobrindo desde os validadores até os fluxos completos de cada tela, e o README traz a arquitetura e um relato honesto dos problemas que enfrentamos — vários deles bugs reais que só apareceram testando de verdade. Obrigado."

---

## Mapa de cobertura (o que o vídeo prova para a banca)

| Requisito do enunciado | Onde aparece |
|---|---|
| Lista de posts | 1.1 |
| Busca de posts | 1.2 |
| Leitura de post | 1.3 |
| Criação de post | 3.2 |
| Edição de post | 3.4 |
| Exclusão de post | 3.4 |
| Login (autenticação) | 2.3 |
| Administração de professores | 5.1 |
| Administração de alunos | 5.2 |
| Persistência da sessão | 4 |

**Tempo somado:** ~12min. Se precisar cortar, o item 6.2 e o teste de limite (3.3) são os primeiros a sacrificar — tudo mais mapeia direto a um requisito.
