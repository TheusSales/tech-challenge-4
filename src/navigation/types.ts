import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Sem `id` nas rotas de formulário = criação; com `id` = edição.
export type PostsStackParamList = {
  PostList: undefined;
  PostDetail: { id: number };
};

export type AdminStackParamList = {
  AdminHome: undefined;
  PostForm: { id?: number } | undefined;
  ProfessorsList: undefined;
  ProfessorForm: { id?: number } | undefined;
  StudentsList: undefined;
  StudentForm: { id?: number } | undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type TabParamList = {
  PostsTab: NavigatorScreenParams<PostsStackParamList>;
  AdminTab: NavigatorScreenParams<AdminStackParamList>;
  AuthTab: NavigatorScreenParams<AuthStackParamList>;
};

export type PostsStackScreenProps<T extends keyof PostsStackParamList> = NativeStackScreenProps<
  PostsStackParamList,
  T
>;

export type AdminStackScreenProps<T extends keyof AdminStackParamList> = NativeStackScreenProps<
  AdminStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<TabParamList, T>;
