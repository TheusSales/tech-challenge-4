import { api } from './index';
import type { Post, PostInput, PostMutationResponse } from '../types/post';
import type { Paginated, PageParams } from '../types/api';

const listTags = (posts: Post[] | undefined) => [
  ...(posts ?? []).map(({ idpost }) => ({ type: 'Post' as const, id: idpost })),
  { type: 'Post' as const, id: 'LIST' },
];

export const postsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listPosts: builder.query<Post[], void>({
      query: () => '/posts',
      providesTags: (result) => listTags(result),
    }),

    // O backend responde 404 quando nada casa com o termo, em vez de devolver
    // lista vazia. Traduzimos esse caso para `[]` aqui, senão toda busca sem
    // resultado apareceria como erro na tela. Demais status seguem como erro.
    searchPosts: builder.query<Post[], string>({
      queryFn: async (q, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({ url: '/posts/search', params: { q } });
        if (result.error) {
          return result.error.status === 404 ? { data: [] } : { error: result.error };
        }
        return { data: result.data as Post[] };
      },
      providesTags: (result) => listTags(result),
    }),

    getPost: builder.query<Post, number>({
      query: (id) => `/posts/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Post', id }],
    }),

    // Listagem da área administrativa: paginada e autenticada.
    adminListPosts: builder.query<Paginated<Post>, PageParams>({
      query: ({ page = 1, pageSize = 20 } = {}) => ({
        url: '/posts/admin',
        params: { page, pageSize },
      }),
      providesTags: (result) => listTags(result?.items),
    }),

    createPost: builder.mutation<PostMutationResponse, PostInput>({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    updatePost: builder.mutation<PostMutationResponse, { id: number; body: PostInput }>({
      query: ({ id, body }) => ({ url: `/posts/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Post', id }, { type: 'Post', id: 'LIST' }],
    }),

    deletePost: builder.mutation<{ message: string }, number>({
      query: (id) => ({ url: `/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Post', id }, { type: 'Post', id: 'LIST' }],
    }),
  }),
});

export const {
  useListPostsQuery,
  useSearchPostsQuery,
  useGetPostQuery,
  useAdminListPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postsApi;
