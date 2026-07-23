import React from 'react';
import { Provider } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { render, screen, userEvent } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import { createStore, type AppStore } from '../../src/store';

const PROFESSOR = { id: 1, name: 'Administrador FIAP', email: 'admin@fiap.com' };
const TOKEN = 'jwt-de-teste';

const json = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  );

const fetchMock = jest.fn();
let store: AppStore;

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  (SecureStore as unknown as { __reset: () => void }).__reset();
  store = createStore();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const renderLogin = () =>
  render(
    <Provider store={store}>
      <LoginScreen />
    </Provider>
  );

// `advanceTimers` liga o userEvent aos fake timers; sem isso ele espera por um
// relógio que não anda e o teste estoura o tempo limite.
const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

const fillAndSubmit = async (email: string, password: string) => {
  const u = user();
  await u.type(screen.getByLabelText('E-mail'), email);
  await u.type(screen.getByLabelText('Senha'), password);
  await u.press(screen.getByRole('button', { name: 'Entrar' }));
};

describe('LoginScreen', () => {
  it('não chama a API com campos vazios e cobra o preenchimento', async () => {
    await renderLogin();

    await user().press(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe o e-mail.')).toBeTruthy();
    expect(screen.getByText('Informe a senha.')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('não chama a API com e-mail malformado', async () => {
    await renderLogin();

    await fillAndSubmit('admin', 'admin123');

    expect(await screen.findByText('Informe um e-mail válido.')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('faz login e grava o token no SecureStore e no state', async () => {
    fetchMock.mockReturnValueOnce(json(200, { token: TOKEN, professor: PROFESSOR }));
    await renderLogin();

    await fillAndSubmit('admin@fiap.com', 'admin123');

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toBe('http://localhost:3000/auth/login');
    expect(request.method).toBe('POST');
    await expect(request.json()).resolves.toEqual({
      email: 'admin@fiap.com',
      password: 'admin123',
    });

    await expect(SecureStore.getItemAsync('token')).resolves.toBe(TOKEN);
    expect(store.getState().auth.token).toBe(TOKEN);
    expect(store.getState().auth.professor).toEqual(PROFESSOR);
  });

  it('remove espaços em volta do e-mail antes de enviar', async () => {
    fetchMock.mockReturnValueOnce(json(200, { token: TOKEN, professor: PROFESSOR }));
    await renderLogin();

    await fillAndSubmit('  admin@fiap.com  ', 'admin123');

    const request = fetchMock.mock.calls[0][0] as Request;
    await expect(request.json()).resolves.toMatchObject({ email: 'admin@fiap.com' });
  });

  // A mensagem tem de ser a do backend, não uma genérica: é ela que diz ao
  // professor que o problema é a credencial, e não a rede.
  it('mostra a mensagem do backend quando a credencial é inválida', async () => {
    fetchMock.mockReturnValueOnce(json(401, { message: 'E-mail ou senha inválidos.' }));
    await renderLogin();

    await fillAndSubmit('admin@fiap.com', 'senha-errada');

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeTruthy();
    expect(store.getState().auth.token).toBeNull();
    await expect(SecureStore.getItemAsync('token')).resolves.toBeNull();
  });

  it('explica a falha de conexão quando a API está fora do ar', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await renderLogin();

    await fillAndSubmit('admin@fiap.com', 'admin123');

    expect(await screen.findByText(/EXPO_PUBLIC_API_URL/)).toBeTruthy();
    expect(store.getState().auth.token).toBeNull();
  });
});
