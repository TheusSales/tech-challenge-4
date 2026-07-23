import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { TabParamList } from './types';
import { PostsStack } from './PostsStack';
import { AdminStack } from './AdminStack';
import { AuthStack } from './AuthStack';
import { useIsAuthenticated } from '../hooks/useAuth';
import { theme } from '../theme';

const Tab = createBottomTabNavigator<TabParamList>();

// A aba de posts existe sempre (conteúdo público). A segunda aba alterna:
// "Entrar" enquanto não há token, "Admin" depois do login. Trocar a aba em vez
// de trocar de navegador raiz preserva a pilha de posts em que o usuário estava.
export function AppTabs() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Tab.Screen
        name="PostsTab"
        component={PostsStack}
        options={{
          title: 'Posts',
          tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" color={color} size={size} />,
        }}
      />
      {isAuthenticated ? (
        <Tab.Screen
          name="AdminTab"
          component={AdminStack}
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
          }}
        />
      ) : (
        <Tab.Screen
          name="AuthTab"
          component={AuthStack}
          options={{
            title: 'Entrar',
            tabBarIcon: ({ color, size }) => <Ionicons name="log-in-outline" color={color} size={size} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}
