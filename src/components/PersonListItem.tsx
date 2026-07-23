import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../theme';

interface PersonListItemProps {
  name: string;
  email: string;
  /** Linha extra opcional — usada pelo RA do aluno. */
  detail?: string | null;
  /** Marca o próprio usuário logado; o backend recusa a auto-exclusão. */
  badge?: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

// Serve professores e alunos: a diferença entre os dois é só o campo extra.
export function PersonListItem({
  name,
  email,
  detail,
  badge,
  onEdit,
  onDelete,
  deleting = false,
}: PersonListItemProps) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${name}`}
        style={styles.info}
      >
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {email}
        </Text>
        {detail ? <Text style={styles.meta}>{detail}</Text> : null}
      </Pressable>

      <Pressable
        onPress={onDelete}
        disabled={deleting}
        accessibilityRole="button"
        accessibilityLabel={`Excluir ${name}`}
        accessibilityState={{ disabled: deleting }}
        hitSlop={8}
        style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color={deleting ? theme.colors.textMuted : theme.colors.danger}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  info: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
    flexShrink: 1,
  },
  badge: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
  },
  action: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  actionPressed: {
    backgroundColor: theme.colors.surfaceHover,
  },
});
