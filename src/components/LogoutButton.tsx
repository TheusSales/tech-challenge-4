import { Pressable, StyleSheet, Text } from 'react-native';
import { useLogout } from '../hooks/useLogout';
import { confirm } from '../utils/confirm';
import { theme } from '../theme';

export function LogoutButton() {
  const logout = useLogout();

  // Confirma antes de sair: o botão fica no cabeçalho, fácil de tocar por engano.
  const handlePress = async () => {
    const confirmed = await confirm({
      title: 'Sair',
      message: 'Deseja encerrar a sessão?',
      confirmLabel: 'Sair',
      destructive: true,
    });

    if (confirmed) {
      await logout();
    }
  };

  return (
    <Pressable onPress={() => void handlePress()} accessibilityRole="button" hitSlop={8}>
      <Text style={styles.label}>Sair</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
  },
});
