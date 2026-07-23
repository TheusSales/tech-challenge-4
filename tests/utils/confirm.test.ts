import { Alert, Platform } from 'react-native';
import { confirm } from '../../src/utils/confirm';

const OPTIONS = {
  title: 'Sair',
  message: 'Deseja encerrar a sessão?',
  confirmLabel: 'Sair',
  destructive: true,
};

// Platform.OS é um getter, então trocar exige redefinir a propriedade.
const withPlatform = (os: string, run: () => void | Promise<void>) => {
  const original = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
  return Promise.resolve(run()).finally(() => {
    if (original) {
      Object.defineProperty(Platform, 'OS', original);
    }
  });
};

describe('confirm no nativo', () => {
  it('resolve true quando o botão de confirmação é tocado', async () => {
    const spy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.text === 'Sair')?.onPress?.();
    });

    await withPlatform('ios', async () => {
      await expect(confirm(OPTIONS)).resolves.toBe(true);
    });

    spy.mockRestore();
  });

  it('resolve false quando o usuário cancela', async () => {
    const spy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.text === 'Cancelar')?.onPress?.();
    });

    await withPlatform('ios', async () => {
      await expect(confirm(OPTIONS)).resolves.toBe(false);
    });

    spy.mockRestore();
  });

  // No Android dá para fechar tocando fora do diálogo. Sem tratar isso a
  // promise ficaria pendente para sempre.
  it('resolve false quando o diálogo é dispensado', async () => {
    const spy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, _b, extra) => {
      extra?.onDismiss?.();
    });

    await withPlatform('android', async () => {
      await expect(confirm(OPTIONS)).resolves.toBe(false);
    });

    spy.mockRestore();
  });
});

// Regressão: o Alert.alert do react-native-web é uma função vazia, então no
// navegador o diálogo nunca aparecia e o clique não fazia absolutamente nada.
describe('confirm no navegador', () => {
  it('usa o confirm do browser em vez do Alert', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const confirmSpy = jest.fn().mockReturnValue(true);
    (globalThis as unknown as { window: { confirm: unknown } }).window = {
      confirm: confirmSpy,
    };

    await withPlatform('web', async () => {
      await expect(confirm(OPTIONS)).resolves.toBe(true);
    });

    expect(confirmSpy).toHaveBeenCalledWith('Sair\n\nDeseja encerrar a sessão?');
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('respeita o cancelamento no browser', async () => {
    (globalThis as unknown as { window: { confirm: unknown } }).window = {
      confirm: jest.fn().mockReturnValue(false),
    };

    await withPlatform('web', async () => {
      await expect(confirm(OPTIONS)).resolves.toBe(false);
    });
  });
});
