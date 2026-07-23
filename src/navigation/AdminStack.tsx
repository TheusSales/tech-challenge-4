import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AdminStackParamList } from './types';
import { screenOptions } from './screenOptions';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import PostFormScreen from '../screens/PostFormScreen';
import ProfessorsListScreen from '../screens/ProfessorsListScreen';
import ProfessorFormScreen from '../screens/ProfessorFormScreen';
import StudentsListScreen from '../screens/StudentsListScreen';
import StudentFormScreen from '../screens/StudentFormScreen';
import { LogoutButton } from '../components/LogoutButton';

const Stack = createNativeStackNavigator<AdminStackParamList>();

// Só é montado quando há token — ver AppTabs.
export function AdminStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ title: 'Administração', headerRight: () => <LogoutButton /> }}
      />
      <Stack.Screen name="PostForm" component={PostFormScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="ProfessorsList" component={ProfessorsListScreen} options={{ title: 'Professores' }} />
      <Stack.Screen name="ProfessorForm" component={ProfessorFormScreen} options={{ title: 'Professor' }} />
      <Stack.Screen name="StudentsList" component={StudentsListScreen} options={{ title: 'Alunos' }} />
      <Stack.Screen name="StudentForm" component={StudentFormScreen} options={{ title: 'Aluno' }} />
    </Stack.Navigator>
  );
}
