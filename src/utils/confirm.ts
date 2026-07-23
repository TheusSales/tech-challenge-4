import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
}

// O `Alert.alert` do react-native-web é literalmente `static alert() {}` — uma
// função vazia. No navegador o diálogo nunca aparecia e o clique não fazia
// nada, sem erro nenhum no console. Este wrapper existe por causa disso: no
// web usa o confirm do browser, no nativo usa o Alert de verdade.
export const confirm = ({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = false,
}: ConfirmOptions): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      // Android permite fechar tocando fora; sem isso a promise ficaria pendente.
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
};
