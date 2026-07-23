import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { PersonListItem } from '../components/PersonListItem';
import { Button } from '../components/Button';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { EmptyState } from '../components/EmptyState';
import { useListStudentsQuery, useDeleteStudentMutation } from '../api/studentsApi';
import { confirm } from '../utils/confirm';
import { getApiErrorMessage } from '../utils/apiError';
import type { AdminStackScreenProps } from '../navigation/types';
import { theme } from '../theme';

export default function StudentsListScreen({ navigation }: AdminStackScreenProps<'StudentsList'>) {
  const [page, setPage] = useState(1);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useListStudentsQuery({ page });
  const [deleteStudent, { isLoading: excluindo }] = useDeleteStudentMutation();

  const alunos = data?.items ?? [];
  const total = data?.total ?? 0;
  const temMais = alunos.length < total;

  const handleDelete = async (id: number, name: string) => {
    const confirmado = await confirm({
      title: 'Excluir aluno',
      message: `O cadastro de ${name} será removido.`,
      confirmLabel: 'Excluir',
      destructive: true,
    });

    if (!confirmado) {
      return;
    }

    try {
      setErroExclusao(null);
      await deleteStudent(id).unwrap();
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
        testID="students-list"
        data={alunos}
        keyExtractor={(aluno) => String(aluno.id)}
        renderItem={({ item }) => (
          <PersonListItem
            name={item.name}
            email={item.email}
            // `ra` é opcional no banco; sem ele a linha extra some.
            detail={item.ra ? `RA ${item.ra}` : null}
            deleting={excluindo}
            onEdit={() => navigation.navigate('StudentForm', { id: item.id })}
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
              {total === 1 ? '1 aluno cadastrado' : `${total} alunos cadastrados`}
            </Text>
            <Button title="Novo aluno" onPress={() => navigation.navigate('StudentForm')} />
            {erroExclusao ? <Text style={styles.erro}>{erroExclusao}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="school-outline"
            title="Nenhum aluno"
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
