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
  { label, error, style, ...inputProps },
  ref
) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.textMuted}
        accessibilityLabel={label}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  error: {
    marginTop: theme.spacing.xs,
    color: theme.colors.danger,
    fontSize: theme.fontSizes.sm,
  },
});
