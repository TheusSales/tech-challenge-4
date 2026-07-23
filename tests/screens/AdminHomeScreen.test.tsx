import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, userEvent, fireEvent, waitFor, act } from '@testing-library/react-native';
import AdminHomeScreen from '../../src/screens/AdminHomeScreen';
import { createStore, type AppStore } from '../../src/store';
import { setCredentials } from '../../src/store/authSlice';
import { confirm } from '../../src/utils/confirm';
import type { AdminStackScreenProps } from '../../src/navigation/types';

jest.mock('../../src/utils/confirm', () => ({ confirm: jest.fn() }));
const confirmMock = confirm as jest.MockedFunction<typeof confirm>;

const PROFESSOR = { id: 1, name: 'Administrador FIAP', email: 'admin@fiap.com' };

const post = (idpost: number, titulo: string) => ({
  idpost,
  titulo,
  conteudo: 'Conteúdo do post.',
  autor: 'Administrador FIAP',
  datacriacao: '2026-07-22T00:24:33.407Z',
});

const PAGINA_1 = { items: [post(9, 'Post nove'), post(8, 'Post oito')], page: 1, pageSize: 2, total: 4 };
const PAGINA_2 = { items: [post(7, 'Post sete'), post(6, 'Post seis')], page: 2, pageSize: 2, total: 4 };

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

// Mock roteado por URL: o teste de paginação faz várias chamadas e depender
// da ordem delas seria frágil.
const respondWith = (responder: (url: string) => Promise<Response>) => {
  fetchMock.mockImplementation((request: Request) => responder(request.url));
};

const listaPaginada = (url: string) =>
  url.includes('page=2') ? json(200, PAGINA_2) : json(200, PAGINA_1);

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  fetchMock.mockReset();
  navigation.navigate.mockReset();
  confirmMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  store = createStore();
  store.dispatch(setCredentials({ token: 'token-valido', professor: PROFESSOR }));
  respondWith(listaPaginada);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const renderScreen = () =>
  render(
    <Provider store={store}>
      <AdminHomeScreen {...({ navigation } as unknown as AdminStackScreenProps<'AdminHome'>)} />
    </Provider>
  );

const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

// O endReached dispara uma busca; sem o act as atualizações que vêm depois da
// resposta acontecem fora do ciclo do React e o teste passa a ver estado velho.
const rolarAteOFim = () =>
  act(async () => {
    fireEvent(screen.getByTestId('admin-post-list'), 'endReached');
  });

describe('AdminHomeScreen', () => {
  it('lista os posts da rota autenticada', async () => {
    await renderScreen();

    expect(await screen.findByText('Post nove')).toBeTruthy();
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toContain('/posts/admin');
    expect(request.headers.get('authorization')).toBe('Bearer token-valido');
  });

  it('mostra o total de posts publicados', async () => {
    await renderScreen();

    expect(await screen.findByText('4 posts publicados')).toBeTruthy();
  });

  it('saúda o professor logado', async () => {
    await renderScreen();

    expect(await screen.findByText('Olá, Administrador FIAP')).toBeTruthy();
  });

  it('abre o formulário vazio em "Novo post"', async () => {
    await renderScreen();
    await screen.findByText('Post nove');

    await user().press(screen.getByRole('button', { name: 'Novo post' }));

    expect(navigation.navigate).toHaveBeenCalledWith('PostForm');
  });

  it('abre o formulário com o id ao tocar num post', async () => {
    await renderScreen();

    await user().press(await screen.findByLabelText('Editar Post nove'));

    expect(navigation.navigate).toHaveBeenCalledWith('PostForm', { id: 9 });
  });

  it('leva para professores e alunos pelos atalhos', async () => {
    await renderScreen();
    await screen.findByText('Post nove');

    await user().press(screen.getByRole('button', { name: 'Professores' }));
    expect(navigation.navigate).toHaveBeenCalledWith('ProfessorsList');

    await user().press(screen.getByRole('button', { name: 'Alunos' }));
    expect(navigation.navigate).toHaveBeenCalledWith('StudentsList');
  });

  it('avisa quando não há post nenhum', async () => {
    respondWith(() => json(200, { items: [], page: 1, pageSize: 20, total: 0 }));
    await renderScreen();

    expect(await screen.findByText('Nenhum post ainda')).toBeTruthy();
  });
});

describe('exclusão', () => {
  it('exclui depois de confirmar', async () => {
    confirmMock.mockResolvedValue(true);
    const deletes: string[] = [];
    respondWith((url) => {
      if (url.includes('/posts/9') ) {
        deletes.push(url);
        return json(200, { message: 'Post deletado com sucesso!' });
      }
      return listaPaginada(url);
    });

    await renderScreen();
    await user().press(await screen.findByLabelText('Excluir Post nove'));

    await waitFor(() => expect(deletes).toHaveLength(1));
    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Excluir post', destructive: true })
    );
  });

  // O clique é destrutivo e fica ao lado do item; cancelar não pode fazer nada.
  it('não exclui quando o usuário cancela', async () => {
    confirmMock.mockResolvedValue(false);
    await renderScreen();

    await user().press(await screen.findByLabelText('Excluir Post nove'));

    const chamadasDelete = fetchMock.mock.calls.filter(
      ([request]) => (request as Request).method === 'DELETE'
    );
    expect(chamadasDelete).toHaveLength(0);
  });

  it('mostra a mensagem do backend se a exclusão falhar', async () => {
    confirmMock.mockResolvedValue(true);
    respondWith((url) =>
      url.includes('/posts/9')
        ? json(500, { message: 'Erro interno no servidor ao deletar o post.' })
        : listaPaginada(url)
    );

    await renderScreen();
    await user().press(await screen.findByLabelText('Excluir Post nove'));

    expect(
      await screen.findByText('Erro interno no servidor ao deletar o post.')
    ).toBeTruthy();
  });
});

describe('paginação', () => {
  // As páginas são acumuladas numa entrada só de cache; o risco é a página 2
  // substituir a 1 em vez de somar.
  it('acrescenta a próxima página sem perder a anterior', async () => {
    await renderScreen();
    await screen.findByText('Post nove');

    await rolarAteOFim();

    expect(await screen.findByText('Post sete')).toBeTruthy();
    expect(screen.getByText('Post nove')).toBeTruthy();
    expect(screen.getByText('Post oito')).toBeTruthy();
    expect(screen.getByText('Post seis')).toBeTruthy();
  });

  it('para de pedir páginas quando já carregou tudo', async () => {
    await renderScreen();
    await screen.findByText('Post nove');

    await rolarAteOFim();
    await screen.findByText('Post sete');
    const apos2Paginas = fetchMock.mock.calls.length;

    await rolarAteOFim();

    expect(fetchMock.mock.calls).toHaveLength(apos2Paginas);
  });
});
