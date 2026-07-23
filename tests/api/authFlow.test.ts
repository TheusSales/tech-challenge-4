import * as SecureStore from 'expo-secure-store';
import { createStore } from '../../src/store';
import { authApi } from '../../src/api/authApi';
import { professorsApi } from '../../src/api/professorsApi';
import { setCredentials } from '../../src/store/authSlice';
import { saveToken } from '../../src/api/tokenStorage';
import { hydrateAuth } from '../../src/store/hydrate';

// Respostas copiadas de chamadas reais ao backend seedado, para o teste falhar
// se o contrato mudar.
const PROFESSOR = { id: 1, name: 'Administrador FIAP', email: 'admin@fiap.com' };
const ME = { ...PROFESSOR, created_at: '2026-07-22T00:24:17.012Z' };

const json = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  );

const fetchMock = jest.fn();

beforeEach(() => {
  // Fake timers para dar cabo do timer de coleta do cache do RTK Query
  // (keepUnusedDataFor, 60s): sem isso ele fica agendado depois do fim do
  // teste e o Jest reclama de acesso ao ambiente já desmontado. Promises e
  // microtasks seguem reais, senão os `await` nos mocks de fetch travariam.
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  (SecureStore as unknown as { __reset: () => void }).__reset();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const authHeaderOf = (call: number): string | null => {
  const request = fetchMock.mock.calls[call][0] as Request;
  return request.headers.get('authorization');
};

// Uma query dispara um timer interno de coleta do cache (keepUnusedDataFor).
// Sem cancelar a inscrição, esse timer sobrevive ao fim do teste e o Jest
// reclama de acesso ao ambiente já desmontado.
const runQuery = async <T extends { unsubscribe: () => void }>(promise: T): Promise<void> => {
  await promise;
  promise.unsubscribe();
};

describe('injeção do Bearer', () => {
  it('não manda header de autorização quando não há sessão', async () => {
    const store = createStore();
    fetchMock.mockReturnValueOnce(json(200, { items: [], page: 1, pageSize: 20, total: 0 }));

    await runQuery(store.dispatch(professorsApi.endpoints.listProfessors.initiate({})));

    expect(authHeaderOf(0)).toBeNull();
  });

  it('manda o token do state em toda requisição depois do login', async () => {
    const store = createStore();
    store.dispatch(setCredentials({ token: 'token-abc', professor: PROFESSOR }));
    fetchMock.mockReturnValueOnce(json(200, { items: [], page: 1, pageSize: 20, total: 0 }));

    await runQuery(store.dispatch(professorsApi.endpoints.listProfessors.initiate({})));

    expect(authHeaderOf(0)).toBe('Bearer token-abc');
  });
});

describe('logout automático no 401', () => {
  // É o cenário do token de 8h que expirou com o app aberto.
  it('derruba a sessão e limpa o SecureStore', async () => {
    const store = createStore();
    await saveToken('token-expirado');
    store.dispatch(setCredentials({ token: 'token-expirado', professor: PROFESSOR }));

    fetchMock.mockReturnValueOnce(json(401, { message: 'Token inválido ou expirado.' }));
    await runQuery(store.dispatch(professorsApi.endpoints.listProfessors.initiate({})));

    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().auth.professor).toBeNull();
    await expect(SecureStore.getItemAsync('token')).resolves.toBeNull();
  });

  // Sem isso, os dados do professor anterior apareceriam por um instante para
  // quem logasse em seguida, antes de o refetch chegar.
  it('descarta o cache do RTK Query junto com a sessão', async () => {
    const store = createStore();
    store.dispatch(setCredentials({ token: 'token-valido', professor: PROFESSOR }));

    fetchMock.mockReturnValueOnce(
      json(200, { items: [ME], page: 1, pageSize: 20, total: 1 })
    );
    const listing = store.dispatch(professorsApi.endpoints.listProfessors.initiate({}));
    await listing;
    expect(Object.keys(store.getState().api.queries)).toHaveLength(1);

    fetchMock.mockReturnValueOnce(json(401, { message: 'Token inválido ou expirado.' }));
    await runQuery(store.dispatch(authApi.endpoints.me.initiate()));
    listing.unsubscribe();

    expect(store.getState().api.queries).toEqual({});
  });
});

// Regressão: o 401 de senha errada não é uma sessão expirada. Tratá-lo como
// tal zerava o cache da API e, junto, o erro da própria tentativa de login —
// a tela ficava em branco depois de errar a senha.
describe('401 sem sessão ativa', () => {
  it('não derruba nada quando o login é recusado', async () => {
    const store = createStore();
    fetchMock.mockReturnValueOnce(json(401, { message: 'E-mail ou senha inválidos.' }));

    const attempt = store.dispatch(
      authApi.endpoints.login.initiate({ email: 'admin@fiap.com', password: 'errada' })
    );
    await attempt;

    const mutations = Object.values(store.getState().api.mutations);
    expect(mutations).toHaveLength(1);
    expect(mutations[0]?.status).toBe('rejected');
    expect(mutations[0]?.error).toMatchObject({
      status: 401,
      data: { message: 'E-mail ou senha inválidos.' },
    });

    attempt.reset();
  });
});

describe('hydrateAuth', () => {
  it('sem token guardado, só encerra a hidratação', async () => {
    const store = createStore();

    await store.dispatch(hydrateAuth());

    expect(store.getState().auth.hydrating).toBe(false);
    expect(store.getState().auth.token).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // O caminho de "abri o app de novo no dia seguinte": o token guardado ainda
  // vale, e o professor volta do /auth/me sem passar pela tela de login.
  it('restaura a sessão quando o token guardado ainda vale', async () => {
    const store = createStore();
    await saveToken('token-guardado');
    fetchMock.mockReturnValueOnce(json(200, ME));

    await store.dispatch(hydrateAuth());

    expect(authHeaderOf(0)).toBe('Bearer token-guardado');
    expect(store.getState().auth.token).toBe('token-guardado');
    expect(store.getState().auth.professor).toEqual(PROFESSOR);
    expect(store.getState().auth.hydrating).toBe(false);
  });

  // Token expirado ou de um professor já excluído: precisa sair limpo, senão
  // o app abriria mostrando a aba Admin de uma sessão que não existe mais.
  it('descarta o token guardado que o backend recusa', async () => {
    const store = createStore();
    await saveToken('token-morto');
    fetchMock.mockReturnValueOnce(json(401, { message: 'Token inválido ou expirado.' }));

    await store.dispatch(hydrateAuth());

    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().auth.hydrating).toBe(false);
    await expect(SecureStore.getItemAsync('token')).resolves.toBeNull();
  });
});
