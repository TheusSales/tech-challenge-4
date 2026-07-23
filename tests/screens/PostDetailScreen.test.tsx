import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, userEvent } from '@testing-library/react-native';
import PostDetailScreen from '../../src/screens/PostDetailScreen';
import { createStore, type AppStore } from '../../src/store';
import type { PostsStackScreenProps } from '../../src/navigation/types';

const POST = {
  idpost: 9,
  titulo: 'Como estudar React Native',
  conteudo: 'Comece pelos componentes básicos, entenda o ciclo de vida.',
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
const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
let store: AppStore;

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  fetchMock.mockReset();
  navigation.setOptions.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  store = createStore();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const renderScreen = (id = 9) =>
  render(
    <Provider store={store}>
      <PostDetailScreen
        {...({
          navigation,
          route: { params: { id } },
        } as unknown as PostsStackScreenProps<'PostDetail'>)}
      />
    </Provider>
  );

const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

describe('PostDetailScreen', () => {
  it('busca o post pelo id da rota e mostra o conteúdo', async () => {
    fetchMock.mockReturnValueOnce(json(200, POST));
    await renderScreen(9);

    expect(await screen.findByText(POST.conteudo)).toBeTruthy();
    expect(screen.getByText('Administrador FIAP')).toBeTruthy();
    expect((fetchMock.mock.calls[0][0] as Request).url).toBe('http://localhost:3000/posts/9');
  });

  it('mostra data e hora no fuso local', async () => {
    fetchMock.mockReturnValueOnce(json(200, POST));
    await renderScreen();

    expect(await screen.findByText('21/07/2026 às 21:24')).toBeTruthy();
  });

  // O cabeçalho nasce como "Post" e só depois vira o título real, porque ele
  // não é conhecido antes da resposta.
  it('troca o título do cabeçalho quando o post chega', async () => {
    fetchMock.mockReturnValueOnce(json(200, POST));
    await renderScreen();
    await screen.findByText(POST.conteudo);

    expect(navigation.setOptions).toHaveBeenCalledWith({ title: POST.titulo });
  });

  it('mostra a mensagem do backend quando o post não existe', async () => {
    fetchMock.mockReturnValueOnce(json(404, { message: 'Post não encontrado' }));
    await renderScreen(999);

    expect(await screen.findByText('Post não encontrado')).toBeTruthy();
  });

  it('permite tentar de novo depois de uma falha', async () => {
    fetchMock.mockReturnValueOnce(json(500, { message: 'Erro interno no servidor.' }));
    await renderScreen();
    await screen.findByText('Erro interno no servidor.');

    fetchMock.mockReturnValueOnce(json(200, POST));
    await user().press(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText(POST.conteudo)).toBeTruthy();
  });
});
