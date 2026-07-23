import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { theme } from '../theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | undefined;
}

// forwardRef para o react-hook-form conseguir focar o campo, e para permitir
// que um campo mande o foco para o seguinte via `returnKeyType="next"`.
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, style, maxLength, value, ...inputProps },
  ref
) {
  // Com `maxLength`, o campo simplesmente para de aceitar texto. Sem o contador
  // isso parece o app travando — o usuário não tem como saber que bateu no
  // limite. Os limites vêm das colunas do banco, ver utils/limits.ts.
  const usado = value?.length ?? 0;
  const perto = maxLength !== undefined && usado >= maxLength * 0.9;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        value={value}
        maxLength={maxLength}
        placeholderTextColor={theme.colors.textMuted}
        accessibilityLabel={label}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...inputProps}
      />
      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : <View />}
        {maxLength !== undefined ? (
          <Text style={[styles.contador, perto ? styles.contadorAlerta : null]}>
            {usado}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.xs,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  error: {
    marginTop: theme.spacing.xs,
    color: theme.colors.danger,
    fontSize: theme.fontSizes.sm,
    flexShrink: 1,
  },
  contador: {
    marginTop: theme.spacing.xs,
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
  },
  contadorAlerta: {
    color: theme.colors.danger,
  },
});
