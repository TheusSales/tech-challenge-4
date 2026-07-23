import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import { logout } from '../store/authSlice';
import { clearToken } from './tokenStorage';
import type { RootState } from '../store';

// Injetada no build pelo Expo a partir do .env (prefixo EXPO_PUBLIC_ é o que
// permite a leitura no bundle do cliente). O endereço correto muda por
// plataforma — ver a tabela no README.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const { token } = (getState() as RootState).auth;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Um 401 em qualquer rota significa token expirado ou revogado (o backend
// devolve 401 tanto para header ausente quanto para JWT inválido). Derruba a
// sessão e limpa o SecureStore; o RootNavigator reage sozinho ao token sumir.
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    api.dispatch(logout());
    await clearToken();
  }

  return result;
};
