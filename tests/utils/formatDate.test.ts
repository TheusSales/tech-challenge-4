import { formatDate, formatDateTime } from '../../src/utils/formatDate';

// O jest.config fixa TZ=America/Sao_Paulo, então estes valores são estáveis.
describe('formatDate', () => {
  it('escreve a data por extenso em português', () => {
    expect(formatDate('2026-03-04T13:50:47.142Z')).toBe('4 de março de 2026');
  });

  // Converter para o fuso local é o comportamento desejado, mas muda o dia:
  // 00:24 UTC ainda é o dia anterior no Brasil.
  it('converte para o fuso local antes de formatar', () => {
    expect(formatDate('2026-07-22T00:24:33.407Z')).toBe('21 de julho de 2026');
  });

  it('devolve string vazia para data inválida', () => {
    expect(formatDate('não é data')).toBe('');
    expect(formatDate('')).toBe('');
  });
});

describe('formatDateTime', () => {
  it('inclui a hora com dois dígitos', () => {
    expect(formatDateTime('2026-07-22T00:24:33.407Z')).toBe('21/07/2026 às 21:24');
  });

  it('preenche o mês com zero à esquerda', () => {
    expect(formatDateTime('2026-03-04T13:50:47.142Z')).toBe('04/03/2026 às 10:50');
  });

  it('devolve string vazia para data inválida', () => {
    expect(formatDateTime('nada')).toBe('');
  });
});
