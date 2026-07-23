import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AdminPostItem } from '../components/AdminPostItem';
import { Button } from '../components/Button';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { EmptyState } from '../components/EmptyState';
import { useAdminListPostsQuery, useDeletePostMutation } from '../api/postsApi';
import { useAuth } from '../hooks/useAuth';
import { confirm } from '../utils/confirm';
import { getApiErrorMessage } from '../utils/apiError';
import type { AdminStackScreenProps } from '../navigation/types';
import { theme } from '../theme';

export default function AdminHomeScreen({ navigation }: AdminStackScreenProps<'AdminHome'>) {
  const { professor } = useAuth();
  const [page, setPage] = useState(1);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useAdminListPostsQuery({ page });
  const [deletePost, { isLoading: excluindo }] = useDeletePostMutation();

  const posts = data?.items ?? [];
  const total = data?.total ?? 0;
  const temMais = posts.length < total;

  const handleDelete = async (id: number, titulo: string) => {
    const confirmado = await confirm({
      title: 'Excluir post',
      message: `"${titulo}" será removido permanentemente.`,
      confirmLabel: 'Excluir',
      destructive: true,
    });

    if (!confirmado) {
      return;
    }

    try {
      setErroExclusao(null);
      await deletePost(id).unwrap();
      // Volta à primeira página: a lista acumulada ficou com um buraco, e a
      // página 1 é o único argumento que faz o cache recomeçar do zero.
      setPage(1);
    } catch (e) {
      setErroExclusao(getApiErrorMessage(e as Parameters<typeof getApiErrorMessage>[0]));
    }
  };

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView message={getApiErrorMessage(error)} onRetry={() => void refetch()} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        // testID só para o teste conseguir disparar o onEndReached; não há
        // como simular rolagem de outro jeito.
        testID="admin-post-list"
        data={posts}
        keyExtractor={(post) => String(post.idpost)}
        renderItem={({ item }) => (
          <AdminPostItem
            post={item}
            deleting={excluindo}
            onEdit={() => navigation.navigate('PostForm', { id: item.idpost })}
            onDelete={() => void handleDelete(item.idpost, item.titulo)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          // `isFetching` evita disparar a próxima página várias vezes enquanto
          // a atual ainda está a caminho.
          if (temMais && !isFetching) {
            setPage((atual) => atual + 1);
          }
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.saudacao}>Olá, {professor?.name ?? 'professor'}</Text>
              <Text style={styles.contagem}>
                {total === 1 ? '1 post publicado' : `${total} posts publicados`}
              </Text>
            </View>

            <Button
              title="Novo post"
              onPress={() => navigation.navigate('PostForm')}
            />

            <View style={styles.atalhos}>
              <Atalho
                icon="people-outline"
                label="Professores"
                onPress={() => navigation.navigate('ProfessorsList')}
              />
              <Atalho
                icon="school-outline"
                label="Alunos"
                onPress={() => navigation.navigate('StudentsList')}
              />
            </View>

            {erroExclusao ? <Text style={styles.erro}>{erroExclusao}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="create-outline"
            title="Nenhum post ainda"
            message="Use o botão acima para publicar o primeiro."
          />
        }
        ListFooterComponent={
          temMais && isFetching ? (
            <ActivityIndicator style={styles.footer} color={theme.colors.primary} />
          ) : null
        }
        refreshing={isFetching && page === 1}
        onRefresh={() => {
          // Voltar para a página 1 já provoca a busca (via `forceRefetch`), e
          // o merge substitui a lista acumulada. Só quando já se está na
          // página 1 é que o refetch precisa ser explícito.
          if (page === 1) {
            void refetch();
          } else {
            setPage(1);
          }
        }}
      />
    </View>
  );
}

function Atalho({
  icon,
  label,
  onPress,
}: {
  icon: 'people-outline' | 'school-outline';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      // O rótulo é explícito porque o Pressable também envolve um ícone, e o
      // leitor de tela anunciaria os dois filhos.
      accessibilityLabel={label}
      style={({ pressed }) => [styles.atalho, pressed ? styles.atalhoPressed : null]}
    >
      <Ionicons name={icon} size={22} color={theme.colors.primary} />
      <Text style={styles.atalhoLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  header: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  saudacao: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold,
  },
  contagem: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
  },
  atalhos: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  atalho: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  atalhoPressed: {
    backgroundColor: theme.colors.surfaceHover,
  },
  atalhoLabel: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
  },
  erro: {
    color: theme.colors.danger,
    fontSize: theme.fontSizes.sm,
  },
  separator: {
    height: theme.spacing.sm,
  },
  footer: {
    paddingVertical: theme.spacing.md,
  },
});
