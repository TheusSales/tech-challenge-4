import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { useGetPostQuery } from '../api/postsApi';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDateTime } from '../utils/formatDate';
import type { PostsStackScreenProps } from '../navigation/types';
import { theme } from '../theme';

export default function PostDetailScreen({
  route,
  navigation,
}: PostsStackScreenProps<'PostDetail'>) {
  const { id } = route.params;
  const { data: post, isLoading, error, refetch } = useGetPostQuery(id);

  // O cabeçalho começa como "Post" e vira o título real quando ele chega.
  useEffect(() => {
    if (post) {
      navigation.setOptions({ title: post.titulo });
    }
  }, [navigation, post]);

  if (isLoading) {
    return <LoadingView />;
  }

  if (error || !post) {
    return (
      <ErrorView
        message={error ? getApiErrorMessage(error) : 'Post não encontrado.'}
        onRetry={() => void refetch()}
      />
    );
  }

  const data = formatDateTime(post.datacriacao);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{post.titulo}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{post.autor}</Text>
        {data ? <Text style={styles.metaText}>{data}</Text> : null}
      </View>
      <Text style={styles.body}>{post.conteudo}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold,
  },
  meta: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  metaText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
  },
  body: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    lineHeight: 26,
  },
});
