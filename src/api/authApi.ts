import { api } from './index';
import type { LoginInput, LoginResponse } from '../types/auth';
import type { Professor } from '../types/professor';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginInput>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Me'],
    }),

    // Usado no boot para validar o token restaurado do SecureStore: se ele
    // não valer mais, o 401 cai no baseQueryWithReauth e a sessão é limpa.
    me: builder.query<Professor, void>({
      query: () => '/auth/me',
      providesTags: ['Me'],
    }),
  }),
});

export const { useLoginMutation, useMeQuery, useLazyMeQuery } = authApi;
