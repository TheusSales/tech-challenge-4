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
    //
    // As páginas são acumuladas numa única entrada de cache, para a tela rolar
    // de forma contínua. Isso exige as três opções abaixo:
    // - `serializeQueryArgs` ignora a página, senão cada uma viraria uma
    //   entrada separada e a lista piscaria inteira a cada carregamento;
    // - `forceRefetch` reativa a busca quando só a página muda, já que para o
    //   cache o argumento passou a ser sempre o mesmo;
    // - `merge` decide entre substituir e concatenar.
    adminListPosts: builder.query<Paginated<Post>, PageParams>({
      query: ({ page = 1, pageSize = 20 } = {}) => ({
        url: '/posts/admin',
        params: { page, pageSize },
      }),
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (cache, incoming, { arg }) => {
        // Página 1 é sempre recomeço: é o que a tela pede depois de criar,
        // editar ou excluir um post.
        if ((arg.page ?? 1) === 1) {
          return incoming;
        }
        // A deduplicação protege do caso em que uma invalidação de tag refaz a
        // página atual: sem ela os mesmos posts entrariam duas vezes na lista.
        const conhecidos = new Set(cache.items.map((post) => post.idpost));
        cache.items.push(...incoming.items.filter((post) => !conhecidos.has(post.idpost)));
        cache.page = incoming.page;
        cache.total = incoming.total;
        return cache;
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.page !== previousArg?.page,
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
