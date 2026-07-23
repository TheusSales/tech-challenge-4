import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { screenOptions } from './screenOptions';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Entrar' }} />
    </Stack.Navigator>
  );
}
