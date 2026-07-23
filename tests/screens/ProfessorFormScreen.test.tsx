import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import ProfessorFormScreen from '../../src/screens/ProfessorFormScreen';
import { createStore, type AppStore } from '../../src/store';
import { setCredentials } from '../../src/store/authSlice';
import type { AdminStackScreenProps } from '../../src/navigation/types';

const LOGADO = { id: 1, name: 'Administrador FIAP', email: 'admin@fiap.com' };

const PROFESSOR = {
  id: 2,
  name: 'Carla Dias',
  email: 'carla.dias@fiap.com',
  created_at: '2026-07-22T00:24:17.012Z',
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
  store.dispatch(setCredentials({ token: 'token-valido', professor: LOGADO }));
  respondWith(() => json(200, PROFESSOR));
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const renderScreen = (params?: { id?: number }) =>
  render(
    <Provider store={store}>
      <ProfessorFormScreen
        {...({
          navigation,
          route: { params },
        } as unknown as AdminStackScreenProps<'ProfessorForm'>)}
      />
    </Provider>
  );

const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

const requestsOf = (method: string) =>
  fetchMock.mock.calls
    .map(([request]) => request as Request)
    .filter((request) => request.method === method);

describe('criação', () => {
  it('cadastra e volta para a listagem', async () => {
    respondWith(() =>
      json(201, { message: 'Professor criado com sucesso!', professor: PROFESSOR })
    );
    await renderScreen();

    const u = user();
    await u.type(screen.getByLabelText('Nome'), 'Carla Dias');
    await u.type(screen.getByLabelText('E-mail'), 'carla.dias@fiap.com');
    await u.type(screen.getByLabelText('Senha'), 'senha123');
    await u.press(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
    const [request] = requestsOf('POST');
    expect(request.url).toBe('http://localhost:3000/professors');
    await expect(request.json()).resolves.toEqual({
      name: 'Carla Dias',
      email: 'carla.dias@fiap.com',
      password: 'senha123',
    });
  });

  it('exige nome, e-mail e senha', async () => {
    await renderScreen();

    await user().press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Informe o nome.')).toBeTruthy();
    expect(screen.getByText('Informe o e-mail.')).toBeTruthy();
    expect(screen.getByText('Informe a senha.')).toBeTruthy();
    expect(requestsOf('POST')).toHaveLength(0);
  });

  it('recusa senha curta demais', async () => {
    await renderScreen();

    const u = user();
    await u.type(screen.getByLabelText('Nome'), 'Carla Dias');
    await u.type(screen.getByLabelText('E-mail'), 'carla.dias@fiap.com');
    await u.type(screen.getByLabelText('Senha'), '123');
    await u.press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Use ao menos 6 caracteres.')).toBeTruthy();
    expect(requestsOf('POST')).toHaveLength(0);
  });

  it('mostra o 409 de e-mail já cadastrado', async () => {
    respondWith(() => json(409, { message: 'Já existe um professor com este e-mail.' }));
    await renderScreen();

    const u = user();
    await u.type(screen.getByLabelText('Nome'), 'Carla Dias');
    await u.type(screen.getByLabelText('E-mail'), 'admin@fiap.com');
    await u.type(screen.getByLabelText('Senha'), 'senha123');
    await u.press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Já existe um professor com este e-mail.')).toBeTruthy();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('respeita o limite das colunas', async () => {
    await renderScreen();

    await user().type(screen.getByLabelText('Nome'), 'a'.repeat(200));

    expect(screen.getByLabelText('Nome').props.value).toHaveLength(120);
    expect(screen.getByText('120/120')).toBeTruthy();
  });
});

describe('edição', () => {
  it('carrega e preenche nome e e-mail, mas não a senha', async () => {
    await renderScreen({ id: 2 });

    await waitFor(() => expect(screen.getByLabelText('Nome').props.value).toBe('Carla Dias'));
    expect(screen.getByLabelText('E-mail').props.value).toBe('carla.dias@fiap.com');
    // A senha nunca volta da API — o campo tem de ficar vazio.
    expect(screen.getByLabelText('Nova senha (opcional)').props.value).toBe('');
  });

  // Mandar string vazia sobrescreveria a senha com o hash de "". O campo
  // precisa sair do corpo da requisição inteiro.
  it('omite a senha do corpo quando o campo fica em branco', async () => {
    respondWith((request) =>
      request.method === 'PUT'
        ? json(200, { message: 'Professor atualizado com sucesso!', professor: PROFESSOR })
        : json(200, PROFESSOR)
    );
    await renderScreen({ id: 2 });
    await waitFor(() => expect(screen.getByLabelText('Nome').props.value).toBe('Carla Dias'));

    const u = user();
    await u.clear(screen.getByLabelText('Nome'));
    await u.type(screen.getByLabelText('Nome'), 'Carla Dias Souza');
    await u.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
    const [request] = requestsOf('PUT');
    expect(request.url).toBe('http://localhost:3000/professors/2');
    await expect(request.json()).resolves.toEqual({
      name: 'Carla Dias Souza',
      email: 'carla.dias@fiap.com',
    });
  });

  it('envia a senha quando o campo é preenchido', async () => {
    respondWith((request) =>
      request.method === 'PUT'
        ? json(200, { message: 'Professor atualizado com sucesso!', professor: PROFESSOR })
        : json(200, PROFESSOR)
    );
    await renderScreen({ id: 2 });
    await waitFor(() => expect(screen.getByLabelText('Nome').props.value).toBe('Carla Dias'));

    const u = user();
    await u.type(screen.getByLabelText('Nova senha (opcional)'), 'novasenha');
    await u.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
    const [request] = requestsOf('PUT');
    await expect(request.json()).resolves.toMatchObject({ password: 'novasenha' });
  });

  it('recusa uma senha nova curta demais', async () => {
    await renderScreen({ id: 2 });
    await waitFor(() => expect(screen.getByLabelText('Nome').props.value).toBe('Carla Dias'));

    const u = user();
    await u.type(screen.getByLabelText('Nova senha (opcional)'), '123');
    await u.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Use ao menos 6 caracteres.')).toBeTruthy();
    expect(requestsOf('PUT')).toHaveLength(0);
  });
});
