import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, userEvent, waitFor, act } from '@testing-library/react-native';
import PostListScreen from '../../src/screens/PostListScreen';
import { createStore, type AppStore } from '../../src/store';
import type { PostsStackScreenProps } from '../../src/navigation/types';

// Formato real de /posts, incluindo as chaves minúsculas que o Postgres impõe.
const POSTS = [
  {
    idpost: 9,
    titulo: 'Como estudar React Native',
    conteudo: 'Comece pelos componentes básicos, entenda o ciclo de vida.',
    autor: 'Administrador FIAP',
    datacriacao: '2026-07-22T00:24:33.407Z',
  },
  {
    idpost: 8,
    titulo: 'Bem-vindo ao blog da turma',
    conteudo: 'Este é o primeiro post da nossa plataforma.',
    autor: 'Administrador FIAP',
    datacriacao: '2026-07-22T00:24:33.403Z',
  },
];

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

// Mock roteado por URL, não por ordem de chamada. Com ordem, qualquer
// requisição a mais recebia `undefined` e o RTK Query estourava lá dentro —
// erro que não derrubava o teste, só sujava o console.
type Responder = (url: string) => Promise<Response>;

const respondWith = (responder: Responder) => {
  fetchMock.mockImplementation((request: Request) => responder(request.url));
};

const defaultResponder: Responder = (url) =>
  url.includes('/posts/search')
    ? json(404, { message: 'Nenhum post encontrado para este termo.' })
    : json(200, POSTS);

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  fetchMock.mockReset();
  navigation.navigate.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  store = createStore();
  respondWith(defaultResponder);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const renderScreen = () =>
  render(
    <Provider store={store}>
      {/* O componente só usa `navigation`; o resto das props da rota não importa aqui. */}
      <PostListScreen {...({ navigation } as unknown as PostsStackScreenProps<'PostList'>)} />
    </Provider>
  );

const urlOf = (call: number) => (fetchMock.mock.calls[call][0] as Request).url;

const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

// Digita e deixa o debounce (300ms) expirar.
const searchFor = async (term: string) => {
  await user().type(screen.getByLabelText('Buscar posts'), term);
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
};

describe('PostListScreen', () => {
  it('lista os posts vindos da API', async () => {
    await renderScreen();

    expect(await screen.findByText('Como estudar React Native')).toBeTruthy();
    expect(screen.getByText('Bem-vindo ao blog da turma')).toBeTruthy();
    expect(urlOf(0)).toBe('http://localhost:3000/posts');
  });

  it('mostra a data formatada em português', async () => {
    await renderScreen();

    expect(await screen.findAllByText('21 de julho de 2026')).toHaveLength(2);
  });

  it('abre o detalhe ao tocar num post', async () => {
    await renderScreen();

    await user().press(await screen.findByText('Como estudar React Native'));

    expect(navigation.navigate).toHaveBeenCalledWith('PostDetail', { id: 9 });
  });

  it('avisa quando ainda não há posts', async () => {
    respondWith(() => json(200, []));
    await renderScreen();

    expect(await screen.findByText('Ainda não há posts')).toBeTruthy();
  });

  it('mostra o erro e permite tentar de novo', async () => {
    respondWith(() => json(500, { message: 'Erro interno no servidor.' }));
    await renderScreen();

    expect(await screen.findByText('Erro interno no servidor.')).toBeTruthy();

    respondWith(defaultResponder);
    await user().press(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Como estudar React Native')).toBeTruthy();
  });
});

describe('busca', () => {
  // O ponto do debounce: digitar não pode disparar uma requisição por tecla.
  it('só busca depois que a digitação para', async () => {
    await renderScreen();
    await screen.findByText('Como estudar React Native');

    await user().type(screen.getByLabelText('Buscar posts'), 'react');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(urlOf(1)).toBe('http://localhost:3000/posts/search?q=react');
  });

  it('mostra só os resultados da busca', async () => {
    respondWith((url) =>
      url.includes('/posts/search') ? json(200, [POSTS[0]]) : json(200, POSTS)
    );
    await renderScreen();
    await screen.findByText('Bem-vindo ao blog da turma');

    await searchFor('react');

    expect(await screen.findByText('Como estudar React Native')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Bem-vindo ao blog da turma')).toBeNull());
  });

  // O backend responde 404 quando nada casa com o termo. Sem o tratamento no
  // postsApi isso apareceria como erro, e não como busca vazia.
  it('trata o 404 da busca como resultado vazio, não como falha', async () => {
    await renderScreen();
    await screen.findByText('Como estudar React Native');

    await searchFor('zzz');

    expect(await screen.findByText('Nenhum post encontrado')).toBeTruthy();
    expect(screen.getByText('Nada corresponde a "zzz".')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
  });

  it('volta para a lista completa ao limpar a busca', async () => {
    respondWith((url) =>
      url.includes('/posts/search') ? json(200, [POSTS[0]]) : json(200, POSTS)
    );
    await renderScreen();
    await screen.findByText('Bem-vindo ao blog da turma');

    await searchFor('react');
    await waitFor(() => expect(screen.queryByText('Bem-vindo ao blog da turma')).toBeNull());

    await user().press(screen.getByRole('button', { name: 'Limpar busca' }));
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText('Bem-vindo ao blog da turma')).toBeTruthy();
  });
});
