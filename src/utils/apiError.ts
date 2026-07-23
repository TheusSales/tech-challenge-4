import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

const FALLBACK = 'Não foi possível completar a operação. Tente novamente.';

// O backend responde erros como { message }. Mas nem todo erro vem de lá:
// falta de rede devolve status 'FETCH_ERROR' sem corpo, e um erro de código
// no cliente chega como SerializedError. Esta função é o único lugar que
// precisa saber disso — as telas só mostram a string.
export const getApiErrorMessage = (
  error: FetchBaseQueryError | SerializedError | undefined
): string => {
  if (!error) {
    return FALLBACK;
  }

  if ('status' in error) {
    if (error.status === 'FETCH_ERROR') {
      return 'Não foi possível falar com o servidor. Confira se a API está no ar e se o EXPO_PUBLIC_API_URL aponta para ela.';
    }

    const data = error.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const { message } = data as { message: unknown };
      if (typeof message === 'string') {
        return message;
      }
    }
    return FALLBACK;
  }

  return error.message ?? FALLBACK;
};
