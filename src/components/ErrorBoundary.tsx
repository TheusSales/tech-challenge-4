import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from './Button';
import { theme } from '../theme';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Erros de renderização não passam pelo tratamento das telas: o React desmonta
// a árvore inteira e o usuário fica com uma tela branca, sem explicação nem
// saída. Só um componente de classe consegue capturá-los — não existe
// equivalente em hooks.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Em produção este seria o ponto de envio para um serviço de telemetria.
    console.error('Erro não tratado na árvore de componentes:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Ionicons name="bug-outline" size={56} color={theme.colors.danger} />
        <Text style={styles.title}>Algo deu errado</Text>
        <Text style={styles.message}>
          O app encontrou um erro inesperado. Você pode tentar voltar; se o problema persistir,
          feche e abra o app novamente.
        </Text>

        {/* O texto do erro fica visível de propósito: é um trabalho acadêmico,
            e ver a mensagem ajuda mais do que esconder. */}
        <ScrollView style={styles.detalhe} contentContainerStyle={styles.detalheContent}>
          <Text style={styles.detalheTexto}>{error.message}</Text>
        </ScrollView>

        <Button title="Tentar novamente" onPress={this.handleReset} style={styles.button} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold,
  },
  message: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    textAlign: 'center',
  },
  detalhe: {
    maxHeight: 140,
    alignSelf: 'stretch',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  detalheContent: {
    padding: theme.spacing.md,
  },
  detalheTexto: {
    color: theme.colors.danger,
    fontSize: theme.fontSizes.sm,
  },
  button: {
    alignSelf: 'stretch',
  },
});
