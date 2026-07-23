import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from './Button';
import { theme } from '../theme';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={48} color={theme.colors.danger} />
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button title="Tentar de novo" onPress={onRetry} variant="ghost" style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  message: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    textAlign: 'center',
  },
  button: {
    minWidth: 180,
  },
});
