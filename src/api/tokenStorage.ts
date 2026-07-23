import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'token';

// O expo-secure-store não existe no web (não há Keychain/Keystore no browser).
// O app-alvo é iOS/Android; o fallback para localStorage serve só para o
// `expo start --web` continuar utilizável em conferências rápidas — não é
// armazenamento seguro e não deve ser usado como plataforma de entrega.
const isWeb = Platform.OS === 'web';

export const saveToken = async (token: string): Promise<void> => {
  if (isWeb) {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const readToken = async (): Promise<string | null> => {
  if (isWeb) {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const clearToken = async (): Promise<void> => {
  if (isWeb) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
