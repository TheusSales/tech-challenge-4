import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';

// O painel de verdade (lista de posts + atalhos para os CRUDs) chega no CP8.
// Por ora mostra quem está logado — é a confirmação visível de que o token
// restaurado do SecureStore foi aceito pelo backend.
export default function AdminHomeScreen() {
  const { professor } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sessão ativa</Text>
      <Text style={styles.name}>{professor?.name ?? '—'}</Text>
      <Text style={styles.email}>{professor?.email ?? ''}</Text>
      <Text style={styles.note}>Painel administrativo completo no CP8.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    marginTop: theme.spacing.xs,
  },
  email: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
  },
  note: {
    marginTop: theme.spacing.xl,
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
  },
});
