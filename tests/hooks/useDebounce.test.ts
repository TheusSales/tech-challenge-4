import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../../src/hooks/useDebounce';

// Atenção ao React Native Testing Library 14: `renderHook`, `rerender` e `act`
// são assíncronos. Sem os `await`, `result.current` fica desatualizado (ou
// `undefined`) e os testes passam a medir a coisa errada.
const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devolve o valor inicial de imediato', async () => {
    const { result } = await renderHook(() => useDebounce('react', 300));
    expect(result.current).toBe('react');
  });

  it('segura o valor novo até o delay passar', async () => {
    const { result, rerender } = await renderHook<string, { value: string }>(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'r' } }
    );

    await rerender({ value: 'react' });
    expect(result.current).toBe('r');

    await advance(299);
    expect(result.current).toBe('r');

    await advance(1);
    expect(result.current).toBe('react');
  });

  // O ponto do debounce na busca: digitar 4 letras seguidas deve resultar em
  // uma única atualização, não quatro chamadas à API.
  it('emite uma vez só para uma sequência rápida de mudanças', async () => {
    const { result, rerender } = await renderHook<string, { value: string }>(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: '' } }
    );

    for (const value of ['r', 're', 'rea', 'reac']) {
      await rerender({ value });
      await advance(100);
      expect(result.current).toBe('');
    }

    await advance(300);
    expect(result.current).toBe('reac');
  });
});
