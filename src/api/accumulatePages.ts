import type { Paginated, PageParams } from '../types/api';

// Faz as páginas se acumularem numa única entrada de cache, para as listas
// rolarem de forma contínua. São três opções que só funcionam juntas:
//
// - `serializeQueryArgs` ignora a página; sem isso cada página vira uma
//   entrada separada e a lista pisca inteira a cada carregamento.
// - `forceRefetch` reativa a busca quando só a página muda, já que para o
//   cache o argumento passou a ser sempre o mesmo.
// - `merge` decide entre substituir (página 1) e concatenar (demais).
//
// A deduplicação por id protege do caso em que uma invalidação de tag refaz a
// página atual: sem ela os mesmos registros entrariam duas vezes na lista.
export const accumulatePages = <T>(idOf: (item: T) => number) => ({
  serializeQueryArgs: ({ endpointName }: { endpointName: string }) => endpointName,

  merge: (cache: Paginated<T>, incoming: Paginated<T>, { arg }: { arg: PageParams }) => {
    // Página 1 é sempre recomeço: é o que as telas pedem depois de criar,
    // editar ou excluir um registro.
    if ((arg.page ?? 1) === 1) {
      return incoming;
    }
    const conhecidos = new Set(cache.items.map(idOf));
    cache.items.push(...incoming.items.filter((item) => !conhecidos.has(idOf(item))));
    cache.page = incoming.page;
    cache.total = incoming.total;
    return cache;
  },

  forceRefetch: ({
    currentArg,
    previousArg,
  }: {
    currentArg?: PageParams | undefined;
    previousArg?: PageParams | undefined;
  }) => currentArg?.page !== previousArg?.page,
});
