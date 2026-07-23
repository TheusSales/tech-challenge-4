import { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { useLoginMutation } from '../api/authApi';
import { saveToken } from '../api/tokenStorage';
import { setCredentials } from '../store/authSlice';
import { useAppDispatch } from '../hooks/useAuth';
import { getApiErrorMessage } from '../utils/apiError';
import { required, validEmail } from '../utils/validators';
import { theme } from '../theme';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const passwordRef = useRef<TextInput>(null);

  const { control, handleSubmit } = useForm<LoginForm>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }: LoginForm) => {
    try {
      const result = await login({ email: email.trim(), password }).unwrap();
      // O token vai para o storage antes do state: se o app for fechado neste
      // instante, a sessão sobrevive. O caminho inverso perderia o token.
      await saveToken(result.token);
      dispatch(setCredentials({ token: result.token, professor: result.professor }));
    } catch {
      // A mensagem vem do `error` da mutation, renderizado abaixo.
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Área do professor</Text>
        <Text style={styles.subtitle}>
          Entre para publicar posts e gerenciar professores e alunos. A leitura dos posts não exige
          login.
        </Text>

        <Controller
          control={control}
          name="email"
          rules={{ validate: { required: required('O e-mail'), validEmail } }}
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <TextField
              label="E-mail"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              placeholder="professor@fiap.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{ validate: { required: required('A senha') } }}
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <TextField
              ref={passwordRef}
              label="Senha"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldState.error?.message}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{getApiErrorMessage(error)}</Text>
          </View>
        ) : null}

        <Button title="Entrar" onPress={handleSubmit(onSubmit)} loading={isLoading} />
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.lg,
  },
  errorBox: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
