import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';
import { messageUtilisateur, type ErreurApplicative } from '@/domain/erreurs';

type Props =
  | { statut: 'chargement' }
  | { statut: 'erreur'; erreur: ErreurApplicative; onReessayer: () => void }
  | { statut: 'vide'; message: string }
  | { statut: 'succes'; children: React.ReactNode };

/**
 * Les 4 états obligatoires d'un écran de données (sujet §Lot 1) :
 * chargement, erreur, vide, succès. Composant unique pour ne pas
 * réécrire cette logique dans chaque écran.
 */
export function EtatEcran(props: Props) {
  switch (props.statut) {
    case 'chargement':
      return (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={theme.couleurs.primaire} />
        </View>
      );
    case 'erreur':
      return (
        <View style={styles.centre}>
          <Text style={styles.messageErreur}>{messageUtilisateur(props.erreur)}</Text>
          <Pressable
            onPress={props.onReessayer}
            style={styles.bouton}
            accessibilityRole="button"
            accessibilityLabel="Réessayer"
          >
            <Text style={styles.libelleBouton}>Réessayer</Text>
          </Pressable>
        </View>
      );
    case 'vide':
      return (
        <View style={styles.centre}>
          <Text style={styles.messageVide}>{props.message}</Text>
        </View>
      );
    case 'succes':
      return <>{props.children}</>;
  }
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.espacements.lg,
    gap: theme.espacements.md,
  },
  messageErreur: { color: theme.couleurs.danger, textAlign: 'center', fontSize: 16 },
  messageVide: { color: theme.couleurs.texteAttenue, textAlign: 'center', fontSize: 16 },
  bouton: {
    backgroundColor: theme.couleurs.primaire,
    paddingHorizontal: theme.espacements.lg,
    paddingVertical: theme.espacements.sm,
    borderRadius: theme.rayons.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  libelleBouton: { color: '#fff', fontWeight: '600' },
});
