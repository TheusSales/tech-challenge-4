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

// Um 401 numa sessão ativa significa token expirado ou revogado: derruba a
// sessão e limpa o SecureStore, e o RootNavigator reage sozinho ao token sumir.
//
// Só que nem todo 401 é isso. O 401 do próprio login é "senha errada", e o de
// quem nunca logou é só "não autorizado" — em nenhum dos dois há sessão para
// derrubar. Tratar esses casos como expiração era pior que inútil: o logout
// zera o cache da API (ver store/listeners.ts) e isso apagava a mensagem de
// erro da própria tentativa de login, deixando a tela em branco depois de
// errar a senha.
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  const hadSession = (api.getState() as RootState).auth.token !== null;
  const isLoginAttempt = api.endpoint === 'login';

  if (result.error?.status === 401 && hadSession && !isLoginAttempt) {
    api.dispatch(logout());
    await clearToken();
  }

  return result;
};
