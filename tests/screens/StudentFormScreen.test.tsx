import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import StudentFormScreen from '../../src/screens/StudentFormScreen';
import { createStore, type AppStore } from '../../src/store';
import { setCredentials } from '../../src/store/authSlice';
import type { AdminStackScreenProps } from '../../src/navigation/types';

const LOGADO = { id: 11, name: 'Administrador FIAP', email: 'admin@fiap.com' };

const ALUNO = {
  id: 1,
  name: 'Ana Souza',
  email: 'ana.souza@aluno.fiap.com',
  ra: '2024001',
  created_at: '2026-07-22T00:24:17.018Z',
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
  respondWith(() => json(200, ALUNO));
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const renderScreen = (params?: { id?: number }) =>
  render(
    <Provider store={store}>
      <StudentFormScreen
        {...({
          navigation,
          route: { params },
        } as unknown as AdminStackScreenProps<'StudentForm'>)}
      />
    </Provider>
  );

const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

const requestsOf = (method: string) =>
  fetchMock.mock.calls
    .map(([request]) => request as Request)
    .filter((request) => request.method === method);

describe('criação', () => {
  it('cadastra com RA e volta para a listagem', async () => {
    respondWith(() => json(201, { message: 'Aluno criado com sucesso!', student: ALUNO }));
    await renderScreen();

    const u = user();
    await u.type(screen.getByLabelText('Nome'), 'Ana Souza');
    await u.type(screen.getByLabelText('E-mail'), 'ana.souza@aluno.fiap.com');
    await u.type(screen.getByLabelText('RA (opcional)'), '2024001');
    await u.press(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
    const [request] = requestsOf('POST');
    expect(request.url).toBe('http://localhost:3000/students');
    await expect(request.json()).resolves.toEqual({
      name: 'Ana Souza',
      email: 'ana.souza@aluno.fiap.com',
      ra: '2024001',
    });
  });

  // A coluna é nullable: em branco tem de virar null, não string vazia, senão
  // o banco guardaria um RA vazio em vez de "não informado".
  it('manda ra null quando o campo fica em branco', async () => {
    respondWith(() => json(201, { message: 'Aluno criado com sucesso!', student: ALUNO }));
    await renderScreen();

    const u = user();
    await u.type(screen.getByLabelText('Nome'), 'Bruno Lima');
    await u.type(screen.getByLabelText('E-mail'), 'bruno.lima@aluno.fiap.com');
    await u.press(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
    const [request] = requestsOf('POST');
    await expect(request.json()).resolves.toEqual({
      name: 'Bruno Lima',
      email: 'bruno.lima@aluno.fiap.com',
      ra: null,
    });
  });

  it('exige nome e e-mail, mas não o RA', async () => {
    await renderScreen();

    await user().press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Informe o nome.')).toBeTruthy();
    expect(screen.getByText('Informe o e-mail.')).toBeTruthy();
    expect(requestsOf('POST')).toHaveLength(0);
  });

  it('recusa e-mail malformado', async () => {
    await renderScreen();

    const u = user();
    await u.type(screen.getByLabelText('Nome'), 'Ana Souza');
    await u.type(screen.getByLabelText('E-mail'), 'ana');
    await u.press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Informe um e-mail válido.')).toBeTruthy();
    expect(requestsOf('POST')).toHaveLength(0);
  });

  it('mostra o 409 de e-mail já cadastrado', async () => {
    respondWith(() => json(409, { message: 'Já existe um aluno com este e-mail.' }));
    await renderScreen();

    const u = user();
    await u.type(screen.getByLabelText('Nome'), 'Ana Souza');
    await u.type(screen.getByLabelText('E-mail'), 'ana.souza@aluno.fiap.com');
    await u.press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Já existe um aluno com este e-mail.')).toBeTruthy();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('respeita o limite do RA', async () => {
    await renderScreen();

    await user().type(screen.getByLabelText('RA (opcional)'), '9'.repeat(60));

    expect(screen.getByLabelText('RA (opcional)').props.value).toHaveLength(40);
    expect(screen.getByText('40/40')).toBeTruthy();
  });
});

describe('edição', () => {
  it('carrega e preenche todos os campos', async () => {
    await renderScreen({ id: 1 });

    await waitFor(() => expect(screen.getByLabelText('Nome').props.value).toBe('Ana Souza'));
    expect(screen.getByLabelText('E-mail').props.value).toBe('ana.souza@aluno.fiap.com');
    expect(screen.getByLabelText('RA (opcional)').props.value).toBe('2024001');
  });

  // Quem foi cadastrado sem RA precisa abrir com o campo vazio, não com "null".
  it('abre com o RA vazio quando o aluno não tem', async () => {
    respondWith(() => json(200, { ...ALUNO, ra: null }));
    await renderScreen({ id: 1 });

    await waitFor(() => expect(screen.getByLabelText('Nome').props.value).toBe('Ana Souza'));
    expect(screen.getByLabelText('RA (opcional)').props.value).toBe('');
  });

  it('salva com PUT no id da rota', async () => {
    respondWith((request) =>
      request.method === 'PUT'
        ? json(200, { message: 'Aluno atualizado com sucesso!', student: ALUNO })
        : json(200, ALUNO)
    );
    await renderScreen({ id: 1 });
    await waitFor(() => expect(screen.getByLabelText('Nome').props.value).toBe('Ana Souza'));

    const u = user();
    await u.clear(screen.getByLabelText('Nome'));
    await u.type(screen.getByLabelText('Nome'), 'Ana Souza Lima');
    await u.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
    const [request] = requestsOf('PUT');
    expect(request.url).toBe('http://localhost:3000/students/1');
    await expect(request.json()).resolves.toMatchObject({ name: 'Ana Souza Lima' });
  });

  it('mostra erro se o aluno não existir', async () => {
    respondWith(() => json(404, { message: 'Aluno não encontrado' }));
    await renderScreen({ id: 999 });

    expect(await screen.findByText('Aluno não encontrado')).toBeTruthy();
  });
});
