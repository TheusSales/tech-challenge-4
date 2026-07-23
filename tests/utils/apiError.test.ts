import { getApiErrorMessage } from '../../src/utils/apiError';

const FALLBACK = 'Não foi possível completar a operação. Tente novamente.';

describe('getApiErrorMessage', () => {
  // O backend responde todo erro como { message } — é o caminho normal.
  it('usa a mensagem do backend', () => {
    const message = getApiErrorMessage({
      status: 401,
      data: { message: 'E-mail ou senha inválidos.' },
    });
    expect(message).toBe('E-mail ou senha inválidos.');
  });

  // Sem rede o RTK Query devolve FETCH_ERROR e nenhum corpo. É o erro mais
  // provável em desenvolvimento (API no ar? EXPO_PUBLIC_API_URL certo?),
  // então merece um texto que aponte a causa em vez do genérico.
  it('explica a falha de conexão em vez do texto genérico', () => {
    const message = getApiErrorMessage({ status: 'FETCH_ERROR', error: 'Failed to fetch' });
    expect(message).toContain('EXPO_PUBLIC_API_URL');
    expect(message).not.toBe(FALLBACK);
  });

  it('cai no texto genérico quando o corpo não tem message', () => {
    expect(getApiErrorMessage({ status: 500, data: { erro: 'algo' } })).toBe(FALLBACK);
  });

  it('cai no texto genérico quando message não é string', () => {
    expect(getApiErrorMessage({ status: 400, data: { message: { a: 1 } } })).toBe(FALLBACK);
  });

  it('cai no texto genérico quando não há corpo', () => {
    expect(getApiErrorMessage({ status: 500, data: undefined })).toBe(FALLBACK);
  });

  // Erro de código no cliente chega como SerializedError, sem `status`.
  it('usa a mensagem de um SerializedError', () => {
    expect(getApiErrorMessage({ name: 'TypeError', message: 'algo quebrou' })).toBe(
      'algo quebrou'
    );
  });

  it('cai no texto genérico quando não há erro nenhum', () => {
    expect(getApiErrorMessage(undefined)).toBe(FALLBACK);
  });
});
