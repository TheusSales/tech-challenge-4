import { api } from './index';
import type { Professor, ProfessorInput, ProfessorMutationResponse } from '../types/professor';
import type { Paginated, PageParams } from '../types/api';
import { accumulatePages } from './accumulatePages';

export const professorsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listProfessors: builder.query<Paginated<Professor>, PageParams>({
      query: ({ page = 1, pageSize = 20 } = {}) => ({
        url: '/professors',
        params: { page, pageSize },
      }),
      ...accumulatePages<Professor>((professor) => professor.id),
      providesTags: (result) => [
        ...(result?.items ?? []).map(({ id }) => ({ type: 'Professor' as const, id })),
        { type: 'Professor' as const, id: 'LIST' },
      ],
    }),

    getProfessor: builder.query<Professor, number>({
      query: (id) => `/professors/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Professor', id }],
    }),

    createProfessor: builder.mutation<ProfessorMutationResponse, ProfessorInput>({
      query: (body) => ({ url: '/professors', method: 'POST', body }),
      invalidatesTags: [{ type: 'Professor', id: 'LIST' }],
    }),

    updateProfessor: builder.mutation<
      ProfessorMutationResponse,
      { id: number; body: ProfessorInput }
    >({
      query: ({ id, body }) => ({ url: `/professors/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Professor', id },
        { type: 'Professor', id: 'LIST' },
        // O professor editado pode ser o logado — recarrega /auth/me.
        'Me',
      ],
    }),

    deleteProfessor: builder.mutation<{ message: string }, number>({
      query: (id) => ({ url: `/professors/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Professor', id },
        { type: 'Professor', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListProfessorsQuery,
  useGetProfessorQuery,
  useCreateProfessorMutation,
  useUpdateProfessorMutation,
  useDeleteProfessorMutation,
} = professorsApi;
