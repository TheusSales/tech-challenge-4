import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, userEvent, fireEvent, act, waitFor } from '@testing-library/react-native';
import StudentsListScreen from '../../src/screens/StudentsListScreen';
import { createStore, type AppStore } from '../../src/store';
import { setCredentials } from '../../src/store/authSlice';
import { confirm } from '../../src/utils/confirm';
import type { AdminStackScreenProps } from '../../src/navigation/types';

jest.mock('../../src/utils/confirm', () => ({ confirm: jest.fn() }));
const confirmMock = confirm as jest.MockedFunction<typeof confirm>;

const LOGADO = { id: 11, name: 'Administrador FIAP', email: 'admin@fiap.com' };

const aluno = (id: number, name: string, ra: string | null) => ({
  id,
  name,
  email: `${name.toLowerCase().replace(' ', '.')}@aluno.fiap.com`,
  ra,
  created_at: '2026-07-22T00:24:17.018Z',
});

const PAGINA_1 = {
  items: [aluno(1, 'Ana Souza', '2024001'), aluno(2, 'Bruno Lima', null)],
  page: 1,
  pageSize: 2,
  total: 3,
};
const PAGINA_2 = { items: [aluno(3, 'Carla Melo', '2024003')], page: 2, pageSize: 2, total: 3 };

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
      <StudentsListScreen
        {...({ navigation } as unknown as AdminStackScreenProps<'StudentsList'>)}
      />
    </Provider>
  );

const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

const rolarAteOFim = () =>
  act(async () => {
    fireEvent(screen.getByTestId('students-list'), 'endReached');
  });

describe('StudentsListScreen', () => {
  it('lista os alunos com e-mail', async () => {
    await renderScreen();

    expect(await screen.findByText('Ana Souza')).toBeTruthy();
    expect(screen.getByText('ana.souza@aluno.fiap.com')).toBeTruthy();
  });

  it('mostra o RA de quem tem', async () => {
    await renderScreen();

    expect(await screen.findByText('RA 2024001')).toBeTruthy();
  });

  // `ra` é nullable no banco; a linha não pode aparecer vazia nem como "null".
  it('omite a linha do RA de quem não tem', async () => {
    await renderScreen();
    await screen.findByText('Bruno Lima');

    expect(screen.queryByText('RA null')).toBeNull();
    expect(screen.queryByText('RA ')).toBeNull();
  });

  it('mostra o total cadastrado', async () => {
    await renderScreen();

    expect(await screen.findByText('3 alunos cadastrados')).toBeTruthy();
  });

  it('abre o formulário vazio e o de edição', async () => {
    await renderScreen();
    await screen.findByText('Ana Souza');

    await user().press(screen.getByRole('button', { name: 'Novo aluno' }));
    expect(navigation.navigate).toHaveBeenCalledWith('StudentForm');

    await user().press(screen.getByLabelText('Editar Ana Souza'));
    expect(navigation.navigate).toHaveBeenCalledWith('StudentForm', { id: 1 });
  });

  it('avisa quando não há aluno', async () => {
    respondWith(() => json(200, { items: [], page: 1, pageSize: 20, total: 0 }));
    await renderScreen();

    expect(await screen.findByText('Nenhum aluno')).toBeTruthy();
  });
});

describe('exclusão', () => {
  it('exclui depois de confirmar', async () => {
    confirmMock.mockResolvedValue(true);
    const deletes: string[] = [];
    respondWith((request) => {
      if (request.method === 'DELETE') {
        deletes.push(request.url);
        return json(200, { message: 'Aluno deletado com sucesso!' });
      }
      return listaPaginada(request);
    });

    await renderScreen();
    await user().press(await screen.findByLabelText('Excluir Ana Souza'));

    await waitFor(() => expect(deletes).toHaveLength(1));
    expect(deletes[0]).toBe('http://localhost:3000/students/1');
  });

  it('não exclui quando o usuário cancela', async () => {
    confirmMock.mockResolvedValue(false);
    await renderScreen();

    await user().press(await screen.findByLabelText('Excluir Ana Souza'));

    const deletes = fetchMock.mock.calls.filter(
      ([request]) => (request as Request).method === 'DELETE'
    );
    expect(deletes).toHaveLength(0);
  });

  it('mostra a mensagem do backend se a exclusão falhar', async () => {
    confirmMock.mockResolvedValue(true);
    respondWith((request) =>
      request.method === 'DELETE'
        ? json(500, { message: 'Erro interno no servidor ao deletar o aluno.' })
        : listaPaginada(request)
    );

    await renderScreen();
    await user().press(await screen.findByLabelText('Excluir Ana Souza'));

    expect(await screen.findByText('Erro interno no servidor ao deletar o aluno.')).toBeTruthy();
  });
});

describe('paginação', () => {
  it('acrescenta a próxima página sem perder a anterior', async () => {
    await renderScreen();
    await screen.findByText('Ana Souza');

    await rolarAteOFim();

    expect(await screen.findByText('Carla Melo')).toBeTruthy();
    expect(screen.getByText('Ana Souza')).toBeTruthy();
    expect(screen.getByText('Bruno Lima')).toBeTruthy();
  });

  it('para de pedir páginas quando já carregou tudo', async () => {
    await renderScreen();
    await screen.findByText('Ana Souza');

    await rolarAteOFim();
    await screen.findByText('Carla Melo');
    const apos2Paginas = fetchMock.mock.calls.length;

    await rolarAteOFim();

    expect(fetchMock.mock.calls).toHaveLength(apos2Paginas);
  });
});
