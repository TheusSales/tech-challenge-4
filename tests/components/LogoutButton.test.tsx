import React from 'react';
import { Provider } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { render, screen, userEvent } from '@testing-library/react-native';
import { LogoutButton } from '../../src/components/LogoutButton';
import { createStore, type AppStore } from '../../src/store';
import { setCredentials } from '../../src/store/authSlice';
import { saveToken } from '../../src/api/tokenStorage';
import { confirm } from '../../src/utils/confirm';

jest.mock('../../src/utils/confirm', () => ({ confirm: jest.fn() }));

const confirmMock = confirm as jest.MockedFunction<typeof confirm>;
const PROFESSOR = { id: 1, name: 'Administrador FIAP', email: 'admin@fiap.com' };

let store: AppStore;

beforeEach(async () => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  confirmMock.mockReset();
  (SecureStore as unknown as { __reset: () => void }).__reset();
  store = createStore();
  await saveToken('token-ativo');
  store.dispatch(setCredentials({ token: 'token-ativo', professor: PROFESSOR }));
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const pressLogout = async () => {
  await render(
    <Provider store={store}>
      <LogoutButton />
    </Provider>
  );
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  await user.press(screen.getByRole('button', { name: 'Sair' }));
};

describe('LogoutButton', () => {
  it('encerra a sessão e limpa o SecureStore quando confirmado', async () => {
    confirmMock.mockResolvedValue(true);

    await pressLogout();

    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().auth.professor).toBeNull();
    await expect(SecureStore.getItemAsync('token')).resolves.toBeNull();
  });

  it('mantém a sessão quando o usuário cancela', async () => {
    confirmMock.mockResolvedValue(false);

    await pressLogout();

    expect(store.getState().auth.token).toBe('token-ativo');
    await expect(SecureStore.getItemAsync('token')).resolves.toBe('token-ativo');
  });

  it('pede confirmação antes de qualquer coisa', async () => {
    confirmMock.mockResolvedValue(false);

    await pressLogout();

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Sair', destructive: true })
    );
  });
});
