import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';

type Props = { children: ReactNode };
type State = { erreur: Error | null };

/**
 * ErrorBoundary global — chapitre 3.3 : un écran exploitable plutôt
 * qu'un écran blanc en cas d'exception non gérée dans le rendu.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { erreur: null };

  static getDerivedStateFromError(erreur: Error): State {
    return { erreur };
  }

  componentDidCatch(erreur: Error, info: { componentStack: string }): void {
    console.error('Erreur non interceptée :', erreur, info.componentStack);
  }

  render() {
    if (this.state.erreur) {
      return (
        <View style={styles.conteneur}>
          <Text style={styles.titre}>Un problème est survenu</Text>
          <Text style={styles.detail}>{this.state.erreur.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.espacements.lg,
    backgroundColor: theme.couleurs.fond,
  },
  titre: { fontSize: 18, fontWeight: '700', color: theme.couleurs.texte, marginBottom: 8 },
  detail: { color: theme.couleurs.texteAttenue, textAlign: 'center' },
});
