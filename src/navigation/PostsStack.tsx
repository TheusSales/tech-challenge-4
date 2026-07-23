import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PostsStackParamList } from './types';
import { screenOptions } from './screenOptions';
import PostListScreen from '../screens/PostListScreen';
import PostDetailScreen from '../screens/PostDetailScreen';

const Stack = createNativeStackNavigator<PostsStackParamList>();

// Área pública: alunos leem os posts sem login.
export function PostsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PostList" component={PostListScreen} options={{ title: 'Posts' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
    </Stack.Navigator>
  );
}
