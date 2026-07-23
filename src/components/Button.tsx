import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '../theme';

type Variant = 'primary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  // Durante o loading o botão também fica inerte: evita disparar a mutation
  // duas vezes com um toque duplo.
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !inactive ? styles[`${variant}Pressed`] : null,
        inactive ? styles.inactive : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? theme.colors.text : '#fff'} />
      ) : (
        <Text style={[styles.label, variant === 'ghost' ? styles.ghostLabel : null]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
  },
  label: {
    color: '#fff',
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  ghostLabel: {
    color: theme.colors.text,
  },
  primary: { backgroundColor: theme.colors.primary },
  primaryPressed: { backgroundColor: theme.colors.primaryHover },
  danger: { backgroundColor: theme.colors.danger },
  dangerPressed: { backgroundColor: theme.colors.dangerHover },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ghostPressed: { backgroundColor: theme.colors.surfaceHover },
  inactive: { opacity: 0.6 },
});
