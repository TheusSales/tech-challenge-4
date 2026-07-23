import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SearchInput } from '../components/SearchInput';
import { PostListItem } from '../components/PostListItem';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { EmptyState } from '../components/EmptyState';
import { useListPostsQuery, useSearchPostsQuery } from '../api/postsApi';
import { useDebounce } from '../hooks/useDebounce';
import { getApiErrorMessage } from '../utils/apiError';
import type { PostsStackScreenProps } from '../navigation/types';
import { theme } from '../theme';

export default function PostListScreen({ navigation }: PostsStackScreenProps<'PostList'>) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query.trim(), 300);
  const isSearching = debounced.length > 0;

  // Os dois hooks são chamados sempre — regra dos hooks —, mas só um busca de
  // verdade. O `skip` é o que evita a requisição inútil.
  const list = useListPostsQuery(undefined, { skip: isSearching });
  const search = useSearchPostsQuery(debounced, { skip: !isSearching });
  const { data, isLoading, isFetching, error, refetch } = isSearching ? search : list;

  const renderContent = () => {
    // `isLoading` é só a primeira carga; num refetch a lista continua na tela.
    if (isLoading) {
      return <LoadingView />;
    }

    if (error) {
      return <ErrorView message={getApiErrorMessage(error)} onRetry={() => void refetch()} />;
    }

    return (
      <FlatList
        data={data ?? []}
        keyExtractor={(post) => String(post.idpost)}
        renderItem={({ item }) => (
          <PostListItem
            post={item}
            onPress={() => navigation.navigate('PostDetail', { id: item.idpost })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isSearching ? (
            <EmptyState
              icon="search-outline"
              title="Nenhum post encontrado"
              message={`Nada corresponde a "${debounced}".`}
            />
          ) : (
            <EmptyState
              title="Ainda não há posts"
              message="Quando um professor publicar, o post aparece aqui."
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={theme.colors.primary}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar posts" />
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchWrapper: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    flexGrow: 1,
  },
  separator: {
    height: theme.spacing.md,
  },
});
