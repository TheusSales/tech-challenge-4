import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

// O React registra o erro no console mesmo quando um boundary o captura.
// Silenciar aqui evita poluir a saída dos testes com um erro esperado.
let consoleError: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  jest.clearAllTimers();
  jest.useRealTimers();
});

function Explode(): React.ReactElement {
  throw new Error('quebrou de propósito');
}

// Renderiza normalmente até alguém tocar no botão; aí passa a explodir.
function PodeExplodir() {
  const [quebrar, setQuebrar] = useState(false);

  if (quebrar) {
    return <Explode />;
  }

  return (
    <Pressable onPress={() => setQuebrar(true)} accessibilityRole="button">
      <Text>Quebrar</Text>
    </Pressable>
  );
}

const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

describe('ErrorBoundary', () => {
  it('não interfere quando não há erro', async () => {
    await render(
      <ErrorBoundary>
        <Text>Conteúdo normal</Text>
      </ErrorBoundary>
    );

    expect(screen.getByText('Conteúdo normal')).toBeTruthy();
  });

  // Sem o boundary, o React desmonta a árvore e sobra uma tela branca.
  it('mostra a tela de erro no lugar de derrubar o app', async () => {
    await render(
      <ErrorBoundary>
        <PodeExplodir />
      </ErrorBoundary>
    );

    await user().press(screen.getByRole('button', { name: 'Quebrar' }));

    expect(screen.getByText('Algo deu errado')).toBeTruthy();
  });

  it('mostra a mensagem do erro, para não esconder a causa', async () => {
    await render(
      <ErrorBoundary>
        <PodeExplodir />
      </ErrorBoundary>
    );

    await user().press(screen.getByRole('button', { name: 'Quebrar' }));

    expect(screen.getByText('quebrou de propósito')).toBeTruthy();
  });

  it('registra o erro no console para depuração', async () => {
    await render(
      <ErrorBoundary>
        <PodeExplodir />
      </ErrorBoundary>
    );

    await user().press(screen.getByRole('button', { name: 'Quebrar' }));

    expect(consoleError).toHaveBeenCalledWith(
      'Erro não tratado na árvore de componentes:',
      expect.objectContaining({ message: 'quebrou de propósito' }),
      expect.anything()
    );
  });

  it('volta a renderizar os filhos ao tentar novamente', async () => {
    await render(
      <ErrorBoundary>
        <PodeExplodir />
      </ErrorBoundary>
    );

    const u = user();
    await u.press(screen.getByRole('button', { name: 'Quebrar' }));
    expect(screen.getByText('Algo deu errado')).toBeTruthy();

    await u.press(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(screen.getByText('Quebrar')).toBeTruthy();
    expect(screen.queryByText('Algo deu errado')).toBeNull();
  });
});
