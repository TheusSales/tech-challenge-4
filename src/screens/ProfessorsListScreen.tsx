import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { PersonListItem } from '../components/PersonListItem';
import { Button } from '../components/Button';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { EmptyState } from '../components/EmptyState';
import { useListProfessorsQuery, useDeleteProfessorMutation } from '../api/professorsApi';
import { useAuth } from '../hooks/useAuth';
import { confirm } from '../utils/confirm';
import { getApiErrorMessage } from '../utils/apiError';
import type { AdminStackScreenProps } from '../navigation/types';
import { theme } from '../theme';

export default function ProfessorsListScreen({
  navigation,
}: AdminStackScreenProps<'ProfessorsList'>) {
  const { professor: logado } = useAuth();
  const [page, setPage] = useState(1);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useListProfessorsQuery({ page });
  const [deleteProfessor, { isLoading: excluindo }] = useDeleteProfessorMutation();

  const professores = data?.items ?? [];
  const total = data?.total ?? 0;
  const temMais = professores.length < total;

  const handleDelete = async (id: number, name: string) => {
    const confirmado = await confirm({
      title: 'Excluir professor',
      message: `${name} perderá o acesso ao sistema.`,
      confirmLabel: 'Excluir',
      destructive: true,
    });

    if (!confirmado) {
      return;
    }

    try {
      setErroExclusao(null);
      await deleteProfessor(id).unwrap();
      setPage(1);
    } catch (e) {
      // Cai aqui, entre outros casos, quando o backend recusa a auto-exclusão
      // com 409. A mensagem dele é mais útil que qualquer texto genérico.
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
        testID="professors-list"
        data={professores}
        keyExtractor={(professor) => String(professor.id)}
        renderItem={({ item }) => (
          <PersonListItem
            name={item.name}
            email={item.email}
            badge={item.id === logado?.id ? 'você' : undefined}
            deleting={excluindo}
            onEdit={() => navigation.navigate('ProfessorForm', { id: item.id })}
            onDelete={() => void handleDelete(item.id, item.name)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (temMais && !isFetching) {
            setPage((atual) => atual + 1);
          }
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.contagem}>
              {total === 1 ? '1 professor cadastrado' : `${total} professores cadastrados`}
            </Text>
            <Button
              title="Novo professor"
              onPress={() => navigation.navigate('ProfessorForm')}
            />
            {erroExclusao ? <Text style={styles.erro}>{erroExclusao}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Nenhum professor"
            message="Cadastre o primeiro pelo botão acima."
          />
        }
        ListFooterComponent={
          temMais && isFetching ? (
            <ActivityIndicator style={styles.footer} color={theme.colors.primary} />
          ) : null
        }
        refreshing={isFetching && page === 1}
        onRefresh={() => {
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
  contagem: {
    color: theme.colors.textMuted,
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
