import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import PostFormScreen from '../../src/screens/PostFormScreen';
import { createStore, type AppStore } from '../../src/store';
import { setCredentials } from '../../src/store/authSlice';
import type { AdminStackScreenProps } from '../../src/navigation/types';

const PROFESSOR = { id: 1, name: 'Administrador FIAP', email: 'admin@fiap.com' };

const POST = {
  idpost: 9,
  titulo: 'Como estudar React Native',
  conteudo: 'Comece pelos componentes básicos.',
  autor: 'Administrador FIAP',
  datacriacao: '2026-07-22T00:24:33.407Z',
};

const json = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  );

const fetchMock = jest.fn();
const navigation = { goBack: jest.fn(), setOptions: jest.fn() };
let store: AppStore;

const respondWith = (responder: (request: Request) => Promise<Response>) => {
  fetchMock.mockImplementation((request: Request) => responder(request));
};

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  fetchMock.mockReset();
  navigation.goBack.mockReset();
  navigation.setOptions.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  store = createStore();
  store.dispatch(setCredentials({ token: 'token-valido', professor: PROFESSOR }));
  respondWith(() => json(200, POST));
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const renderScreen = (params?: { id?: number }) =>
  render(
    <Provider store={store}>
      <PostFormScreen
        {...({
          navigation,
          route: { params },
        } as unknown as AdminStackScreenProps<'PostForm'>)}
      />
    </Provider>
  );

const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

const requestsOf = (method: string) =>
  fetchMock.mock.calls
    .map(([request]) => request as Request)
    .filter((request) => request.method === method);

describe('criação', () => {
  it('já vem com o autor preenchido com o professor logado', async () => {
    await renderScreen();

    expect(screen.getByLabelText('Autor').props.value).toBe('Administrador FIAP');
  });

  it('nomeia o cabeçalho como "Novo post"', async () => {
    await renderScreen();

    expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Novo post' });
  });

  it('envia o post e volta para a listagem', async () => {
    respondWith(() => json(201, { message: 'Post criado com sucesso! 🚀', post: POST }));
    await renderScreen();

    const u = user();
    await u.type(screen.getByLabelText('Título'), 'Título novo');
    await u.type(screen.getByLabelText('Conteúdo'), 'Conteúdo novo');
    await u.press(screen.getByRole('button', { name: 'Publicar' }));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
    const [request] = requestsOf('POST');
    expect(request.url).toBe('http://localhost:3000/posts');
    await expect(request.json()).resolves.toEqual({
      titulo: 'Título novo',
      conteudo: 'Conteúdo novo',
      autor: 'Administrador FIAP',
    });
  });

  it('não envia com campos vazios', async () => {
    await renderScreen();

    await user().press(screen.getByRole('button', { name: 'Publicar' }));

    expect(await screen.findByText('Informe o título.')).toBeTruthy();
    expect(screen.getByText('Informe o conteúdo.')).toBeTruthy();
    expect(requestsOf('POST')).toHaveLength(0);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  // Se a criação falha, ficar na tela preserva o texto já digitado.
  it('mostra o erro da API e permanece no formulário', async () => {
    respondWith(() => json(500, { message: 'Erro interno no servidor ao criar o post.' }));
    await renderScreen();

    const u = user();
    await u.type(screen.getByLabelText('Título'), 'Título novo');
    await u.type(screen.getByLabelText('Conteúdo'), 'Conteúdo novo');
    await u.press(screen.getByRole('button', { name: 'Publicar' }));

    expect(await screen.findByText('Erro interno no servidor ao criar o post.')).toBeTruthy();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});

describe('edição', () => {
  it('carrega o post e preenche o formulário', async () => {
    await renderScreen({ id: 9 });

    await waitFor(() =>
      expect(screen.getByLabelText('Título').props.value).toBe(POST.titulo)
    );
    expect(screen.getByLabelText('Conteúdo').props.value).toBe(POST.conteudo);
    expect(fetchMock.mock.calls[0][0].url).toBe('http://localhost:3000/posts/9');
  });

  it('nomeia o cabeçalho como "Editar post"', async () => {
    await renderScreen({ id: 9 });

    expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Editar post' });
  });

  it('salva com PUT no id da rota', async () => {
    respondWith((request) =>
      request.method === 'PUT'
        ? json(200, { message: 'Post atualizado com sucesso!', post: POST })
        : json(200, POST)
    );
    await renderScreen({ id: 9 });
    await waitFor(() => expect(screen.getByLabelText('Título').props.value).toBe(POST.titulo));

    const u = user();
    await u.clear(screen.getByLabelText('Título'));
    await u.type(screen.getByLabelText('Título'), 'Título editado');
    await u.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
    const [request] = requestsOf('PUT');
    expect(request.url).toBe('http://localhost:3000/posts/9');
    await expect(request.json()).resolves.toMatchObject({ titulo: 'Título editado' });
  });

  it('mostra erro se o post não existir', async () => {
    respondWith(() => json(404, { message: 'Post não encontrado' }));
    await renderScreen({ id: 999 });

    expect(await screen.findByText('Post não encontrado')).toBeTruthy();
  });
});
