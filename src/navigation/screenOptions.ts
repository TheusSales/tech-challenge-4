import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { theme } from '../theme';

// Cabeçalho escuro compartilhado pelos três stacks.
export const screenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: theme.colors.surface },
  headerTintColor: theme.colors.text,
  headerTitleStyle: { fontWeight: theme.fontWeights.bold },
  contentStyle: { backgroundColor: theme.colors.background },
};
