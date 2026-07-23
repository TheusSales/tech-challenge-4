import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import {
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
} from '../api/postsApi';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../utils/apiError';
import { required } from '../utils/validators';
import type { AdminStackScreenProps } from '../navigation/types';
import { theme } from '../theme';

interface PostForm {
  titulo: string;
  conteudo: string;
  autor: string;
}

export default function PostFormScreen({ route, navigation }: AdminStackScreenProps<'PostForm'>) {
  const id = route.params?.id;
  const editando = id !== undefined;
  const { professor } = useAuth();

  const { data: post, isLoading: carregando, error: erroCarga, refetch } = useGetPostQuery(
    id as number,
    { skip: !editando }
  );

  const [createPost, { isLoading: criando, error: erroCriacao }] = useCreatePostMutation();
  const [updatePost, { isLoading: salvando, error: erroEdicao }] = useUpdatePostMutation();

  const { control, handleSubmit, reset } = useForm<PostForm>({
    // Em post novo o autor já vem preenchido com quem está logado, mas segue
    // editável: o backend trata `autor` como texto livre.
    defaultValues: { titulo: '', conteudo: '', autor: professor?.name ?? '' },
  });

  useEffect(() => {
    navigation.setOptions({ title: editando ? 'Editar post' : 'Novo post' });
  }, [navigation, editando]);

  // O formulário nasce vazio e só é preenchido quando o post chega da API.
  useEffect(() => {
    if (post) {
      reset({ titulo: post.titulo, conteudo: post.conteudo, autor: post.autor });
    }
  }, [post, reset]);

  const onSubmit = async (values: PostForm) => {
    const body = {
      titulo: values.titulo.trim(),
      conteudo: values.conteudo.trim(),
      autor: values.autor.trim(),
    };

    try {
      if (editando) {
        await updatePost({ id, body }).unwrap();
      } else {
        await createPost(body).unwrap();
      }
      navigation.goBack();
    } catch {
      // A mensagem sai do `error` da mutation, renderizado abaixo.
    }
  };

  if (editando && carregando) {
    return <LoadingView />;
  }

  if (editando && erroCarga) {
    return <ErrorView message={getApiErrorMessage(erroCarga)} onRetry={() => void refetch()} />;
  }

  const erro = erroCriacao ?? erroEdicao;
  const enviando = criando || salvando;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="titulo"
          rules={{ validate: { required: required('Informe o título.') } }}
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <TextField
              label="Título"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              placeholder="Ex.: Introdução a hooks"
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="autor"
          rules={{ validate: { required: required('Informe o autor.') } }}
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <TextField
              label="Autor"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              placeholder="Nome de quem assina"
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="conteudo"
          rules={{ validate: { required: required('Informe o conteúdo.') } }}
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <TextField
              label="Conteúdo"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              placeholder="Escreva o post"
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              style={styles.textarea}
            />
          )}
        />

        {erro ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{getApiErrorMessage(erro)}</Text>
          </View>
        ) : null}

        <Button
          title={editando ? 'Salvar alterações' : 'Publicar'}
          onPress={handleSubmit(onSubmit)}
          loading={enviando}
        />
        <Button
          title="Cancelar"
          variant="ghost"
          onPress={() => navigation.goBack()}
          disabled={enviando}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  textarea: {
    minHeight: 180,
    paddingTop: theme.spacing.md,
  },
  errorBox: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSizes.sm,
  },
});
