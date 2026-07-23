import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Post } from '../types/post';
import { formatDate } from '../utils/formatDate';
import { theme } from '../theme';

interface PostListItemProps {
  post: Post;
  onPress: () => void;
}

export function PostListItem({ post, onPress }: PostListItemProps) {
  const data = formatDate(post.datacriacao);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      // O título já identifica o item; repetir autor e data no rótulo deixaria
      // a navegação por leitor de tela lenta demais.
      accessibilityLabel={post.titulo}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <Text style={styles.title} numberOfLines={2}>
        {post.titulo}
      </Text>
      <Text style={styles.excerpt} numberOfLines={3}>
        {post.conteudo}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.meta} numberOfLines={1}>
          {post.autor}
        </Text>
        {data ? <Text style={styles.meta}>{data}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
  },
  pressed: {
    backgroundColor: theme.colors.surfaceHover,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  excerpt: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.sm,
    flexShrink: 1,
  },
});
