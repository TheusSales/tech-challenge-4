import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import {
  useGetProfessorQuery,
  useCreateProfessorMutation,
  useUpdateProfessorMutation,
} from '../api/professorsApi';
import { getApiErrorMessage } from '../utils/apiError';
import { required, validEmail, minLength } from '../utils/validators';
import { LIMITES } from '../utils/limits';
import type { ProfessorInput } from '../types/professor';
import type { AdminStackScreenProps } from '../navigation/types';
import { theme } from '../theme';

interface ProfessorForm {
  name: string;
  email: string;
  password: string;
}

const SENHA_MINIMA = 6;

export default function ProfessorFormScreen({
  route,
  navigation,
}: AdminStackScreenProps<'ProfessorForm'>) {
  const id = route.params?.id;
  const editando = id !== undefined;

  const {
    data: professor,
    isLoading: carregando,
    error: erroCarga,
    refetch,
  } = useGetProfessorQuery(id as number, { skip: !editando });

  const [createProfessor, { isLoading: criando, error: erroCriacao }] =
    useCreateProfessorMutation();
  const [updateProfessor, { isLoading: salvando, error: erroEdicao }] =
    useUpdateProfessorMutation();

  const { control, handleSubmit, reset } = useForm<ProfessorForm>({
    defaultValues: { name: '', email: '', password: '' },
  });

  useEffect(() => {
    navigation.setOptions({ title: editando ? 'Editar professor' : 'Novo professor' });
  }, [navigation, editando]);

  useEffect(() => {
    if (professor) {
      // A senha nunca volta da API — o campo fica vazio e só é enviado se o
      // usuário digitar uma nova.
      reset({ name: professor.name, email: professor.email, password: '' });
    }
  }, [professor, reset]);

  const onSubmit = async (values: ProfessorForm) => {
    const senha = values.password.trim();
    const body: ProfessorInput = {
      name: values.name.trim(),
      email: values.email.trim(),
      // Na edição, omitir a senha faz o backend manter a atual (COALESCE).
      // Mandar string vazia sobrescreveria com um hash de vazio.
      ...(senha ? { password: senha } : {}),
    };

    try {
      if (editando) {
        await updateProfessor({ id, body }).unwrap();
      } else {
        await createProfessor(body).unwrap();
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
          name="name"
          rules={{ validate: { required: required('Informe o nome.') } }}
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <TextField
              label="Nome"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              placeholder="Nome completo"
              maxLength={LIMITES.professor.name}
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          rules={{ validate: { required: required('Informe o e-mail.'), validEmail } }}
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <TextField
              label="E-mail"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              placeholder="professor@fiap.com"
              maxLength={LIMITES.professor.email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{
            validate: (value) => {
              const senha = value.trim();
              // Em edição, campo vazio significa "manter a senha atual".
              if (editando && senha.length === 0) {
                return true;
              }
              if (senha.length === 0) {
                return 'Informe a senha.';
              }
              return minLength(SENHA_MINIMA)(senha);
            },
          }}
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <TextField
              label={editando ? 'Nova senha (opcional)' : 'Senha'}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              placeholder={editando ? 'Deixe em branco para manter' : 'Mínimo de 6 caracteres'}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />

        {erro ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{getApiErrorMessage(erro)}</Text>
          </View>
        ) : null}

        <Button
          title={editando ? 'Salvar alterações' : 'Cadastrar'}
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
