import { useEffect, useState } from 'react';

// Portado verbatim de ~/Projetos/tech-challenge-3/src/hooks/useDebounce.ts.
// Retorna o valor "atrasado" — só atualiza depois que `delay` ms passaram
// sem mudanças. Útil pra busca: evita disparar uma chamada à API a cada
// tecla digitada.
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
