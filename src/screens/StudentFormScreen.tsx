import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import {
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
} from '../api/studentsApi';
import { getApiErrorMessage } from '../utils/apiError';
import { required, validEmail } from '../utils/validators';
import { LIMITES } from '../utils/limits';
import type { StudentInput } from '../types/student';
import type { AdminStackScreenProps } from '../navigation/types';
import { theme } from '../theme';

interface StudentForm {
  name: string;
  email: string;
  ra: string;
}

export default function StudentFormScreen({
  route,
  navigation,
}: AdminStackScreenProps<'StudentForm'>) {
  const id = route.params?.id;
  const editando = id !== undefined;

  const {
    data: aluno,
    isLoading: carregando,
    error: erroCarga,
    refetch,
  } = useGetStudentQuery(id as number, { skip: !editando });

  const [createStudent, { isLoading: criando, error: erroCriacao }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: salvando, error: erroEdicao }] = useUpdateStudentMutation();

  const { control, handleSubmit, reset } = useForm<StudentForm>({
    defaultValues: { name: '', email: '', ra: '' },
  });

  useEffect(() => {
    navigation.setOptions({ title: editando ? 'Editar aluno' : 'Novo aluno' });
  }, [navigation, editando]);

  useEffect(() => {
    if (aluno) {
      reset({ name: aluno.name, email: aluno.email, ra: aluno.ra ?? '' });
    }
  }, [aluno, reset]);

  const onSubmit = async (values: StudentForm) => {
    const ra = values.ra.trim();
    const body: StudentInput = {
      name: values.name.trim(),
      email: values.email.trim(),
      // O RA é opcional: campo em branco vira null, e não string vazia, para
      // a coluna refletir "não informado" em vez de um RA vazio.
      ra: ra.length > 0 ? ra : null,
    };

    try {
      if (editando) {
        await updateStudent({ id, body }).unwrap();
      } else {
        await createStudent(body).unwrap();
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
              maxLength={LIMITES.student.name}
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
              placeholder="aluno@aluno.fiap.com"
              maxLength={LIMITES.student.email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="ra"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="RA (opcional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex.: 2024001"
              maxLength={LIMITES.student.ra}
              autoCapitalize="none"
              autoCorrect={false}
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
