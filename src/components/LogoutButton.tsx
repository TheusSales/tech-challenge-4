import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useLogout } from '../hooks/useLogout';
import { theme } from '../theme';

export function LogoutButton() {
  const logout = useLogout();

  // Confirma antes de sair: o botão fica no cabeçalho, fácil de tocar por engano.
  const confirm = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <Pressable onPress={confirm} accessibilityRole="button" hitSlop={8}>
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
