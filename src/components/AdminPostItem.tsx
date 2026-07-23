import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Post } from '../types/post';
import { formatDate } from '../utils/formatDate';
import { theme } from '../theme';

interface AdminPostItemProps {
  post: Post;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

export function AdminPostItem({ post, onEdit, onDelete, deleting = false }: AdminPostItemProps) {
  const data = formatDate(post.datacriacao);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${post.titulo}`}
        style={styles.info}
      >
        <Text style={styles.title} numberOfLines={2}>
          {post.titulo}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {post.autor}
          {data ? ` · ${data}` : ''}
        </Text>
      </Pressable>

      <Pressable
        onPress={onDelete}
        disabled={deleting}
        accessibilityRole="button"
        accessibilityLabel={`Excluir ${post.titulo}`}
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
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
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
