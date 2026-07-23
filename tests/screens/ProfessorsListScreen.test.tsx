import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, userEvent, fireEvent, act, waitFor } from '@testing-library/react-native';
import ProfessorsListScreen from '../../src/screens/ProfessorsListScreen';
import { createStore, type AppStore } from '../../src/store';
import { setCredentials } from '../../src/store/authSlice';
import { confirm } from '../../src/utils/confirm';
import type { AdminStackScreenProps } from '../../src/navigation/types';

jest.mock('../../src/utils/confirm', () => ({ confirm: jest.fn() }));
const confirmMock = confirm as jest.MockedFunction<typeof confirm>;

const LOGADO = { id: 1, name: 'Administrador FIAP', email: 'admin@fiap.com' };

const professor = (id: number, name: string) => ({
  id,
  name,
  email: `${name.toLowerCase().replace(' ', '.')}@fiap.com`,
  created_at: '2026-07-22T00:24:17.012Z',
});

const PAGINA_1 = {
  items: [professor(1, 'Administrador FIAP'), professor(2, 'Carla Dias')],
  page: 1,
  pageSize: 2,
  total: 3,
};
const PAGINA_2 = { items: [professor(3, 'Diego Reis')], page: 2, pageSize: 2, total: 3 };

const json = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  );

const fetchMock = jest.fn();
const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
let store: AppStore;

const respondWith = (responder: (request: Request) => Promise<Response>) => {
  fetchMock.mockImplementation((request: Request) => responder(request));
};

const listaPaginada = (request: Request) =>
  request.url.includes('page=2') ? json(200, PAGINA_2) : json(200, PAGINA_1);

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  fetchMock.mockReset();
  navigation.navigate.mockReset();
  confirmMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  store = createStore();
  store.dispatch(setCredentials({ token: 'token-valido', professor: LOGADO }));
  respondWith(listaPaginada);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const renderScreen = () =>
  render(
    <Provider store={store}>
      <ProfessorsListScreen
        {...({ navigation } as unknown as AdminStackScreenProps<'ProfessorsList'>)}
      />
    </Provider>
  );

const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

const rolarAteOFim = () =>
  act(async () => {
    fireEvent(screen.getByTestId('professors-list'), 'endReached');
  });

describe('ProfessorsListScreen', () => {
  it('lista os professores com e-mail', async () => {
    await renderScreen();

    expect(await screen.findByText('Carla Dias')).toBeTruthy();
    expect(screen.getByText('carla.dias@fiap.com')).toBeTruthy();
  });

  it('mostra o total cadastrado', async () => {
    await renderScreen();

    expect(await screen.findByText('3 professores cadastrados')).toBeTruthy();
  });

  // Ajuda a entender por que a exclusão desse registro vai ser recusada.
  it('marca o professor logado', async () => {
    await renderScreen();

    expect(await screen.findByText('você')).toBeTruthy();
  });

  it('abre o formulário vazio e o de edição', async () => {
    await renderScreen();
    await screen.findByText('Carla Dias');

    await user().press(screen.getByRole('button', { name: 'Novo professor' }));
    expect(navigation.navigate).toHaveBeenCalledWith('ProfessorForm');

    await user().press(screen.getByLabelText('Editar Carla Dias'));
    expect(navigation.navigate).toHaveBeenCalledWith('ProfessorForm', { id: 2 });
  });

  it('avisa quando não há professor', async () => {
    respondWith(() => json(200, { items: [], page: 1, pageSize: 20, total: 0 }));
    await renderScreen();

    expect(await screen.findByText('Nenhum professor')).toBeTruthy();
  });
});

describe('exclusão', () => {
  it('exclui depois de confirmar', async () => {
    confirmMock.mockResolvedValue(true);
    const deletes: string[] = [];
    respondWith((request) => {
      if (request.method === 'DELETE') {
        deletes.push(request.url);
        return json(200, { message: 'Professor deletado com sucesso!' });
      }
      return listaPaginada(request);
    });

    await renderScreen();
    await user().press(await screen.findByLabelText('Excluir Carla Dias'));

    await waitFor(() => expect(deletes).toHaveLength(1));
    expect(deletes[0]).toBe('http://localhost:3000/professors/2');
  });

  it('não exclui quando o usuário cancela', async () => {
    confirmMock.mockResolvedValue(false);
    await renderScreen();

    await user().press(await screen.findByLabelText('Excluir Carla Dias'));

    const deletes = fetchMock.mock.calls.filter(
      ([request]) => (request as Request).method === 'DELETE'
    );
    expect(deletes).toHaveLength(0);
  });

  // O backend recusa a auto-exclusão com 409 para o sistema não ficar sem
  // nenhum acesso. A mensagem dele precisa chegar à tela.
  it('mostra o 409 ao tentar excluir a si mesmo', async () => {
    confirmMock.mockResolvedValue(true);
    respondWith((request) =>
      request.method === 'DELETE'
        ? json(409, { message: 'Você não pode excluir o próprio usuário.' })
        : listaPaginada(request)
    );

    await renderScreen();
    await user().press(await screen.findByLabelText('Excluir Administrador FIAP'));

    expect(await screen.findByText('Você não pode excluir o próprio usuário.')).toBeTruthy();
  });
});

describe('paginação', () => {
  it('acrescenta a próxima página sem perder a anterior', async () => {
    await renderScreen();
    await screen.findByText('Carla Dias');

    await rolarAteOFim();

    expect(await screen.findByText('Diego Reis')).toBeTruthy();
    expect(screen.getByText('Carla Dias')).toBeTruthy();
    expect(screen.getByText('Administrador FIAP')).toBeTruthy();
  });

  it('para de pedir páginas quando já carregou tudo', async () => {
    await renderScreen();
    await screen.findByText('Carla Dias');

    await rolarAteOFim();
    await screen.findByText('Diego Reis');
    const apos2Paginas = fetchMock.mock.calls.length;

    await rolarAteOFim();

    expect(fetchMock.mock.calls).toHaveLength(apos2Paginas);
  });
});
