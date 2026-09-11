import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';
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
  const { t } = useTranslation();
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);

  switch (props.statut) {
    case 'chargement':
      return (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={themeActif.couleurs.primaire} accessibilityRole="progressbar" accessibilityLabel={t('commun.chargementAccessible')} />
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
            accessibilityLabel={t('commun.reessayer')}
          >
            <Text style={styles.libelleBouton}>{t('commun.reessayer')}</Text>
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

function creerStyles(theme: Theme) {
  return StyleSheet.create({
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
    libelleBouton: { color: theme.couleurs.surAccent, fontWeight: '600' },
  });
}
