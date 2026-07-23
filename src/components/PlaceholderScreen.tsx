import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

// Andaime do CP5: cada tela real substitui este corpo nos checkpoints
// seguintes. Serve para os navegadores já montarem e serem navegáveis.
export function PlaceholderScreen({ name, note }: { name: string; note?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
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
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  note: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    textAlign: 'center',
  },
});
