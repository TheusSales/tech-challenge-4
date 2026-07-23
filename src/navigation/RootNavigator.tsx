import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, DarkTheme, type Theme as NavTheme } from '@react-navigation/native';
import { AppTabs } from './AppTabs';
import { hydrateAuth } from '../store/hydrate';
import { useAppDispatch, useAuth } from '../hooks/useAuth';
import { theme } from '../theme';

const navigationTheme: NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
  },
};

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const { hydrating } = useAuth();

  useEffect(() => {
    void dispatch(hydrateAuth());
  }, [dispatch]);

  // Segura a UI até saber se há sessão: evita a aba "Entrar" piscar para quem
  // já estava logado.
  if (hydrating) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <AppTabs />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});
