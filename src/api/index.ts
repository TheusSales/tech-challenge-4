import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

// Uma única API para todo o app: os arquivos irmãos usam `injectEndpoints`
// em vez de criar `createApi` próprios. Assim há só um reducer e um middleware
// no store, e a invalidação por tag funciona entre recursos.
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Post', 'Professor', 'Student', 'Me'],
  endpoints: () => ({}),
});
