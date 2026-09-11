import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSuppressionEnAttente } from '@/features/books/suppressionEnAttente';
import { useSupprimerLivreDifféré, DELAI_ANNULATION_MS } from '@/hooks/useModifierLivre';
import { theme } from '@/theme';

/**
 * Bandeau global de rattrapage après suppression (Lot 1) : affiché au niveau
 * du layout racine, donc visible quel que soit l'écran d'où la suppression a
 * été déclenchée. Se referme seul après le même délai que la suppression
 * réelle (5s) — les deux minuteurs démarrent au même instant.
 */
export function BandeauAnnulation() {
  const livre = useSuppressionEnAttente((etat) => etat.livre);
  const effacer = useSuppressionEnAttente((etat) => etat.effacer);
  const { annuler } = useSupprimerLivreDifféré();

  useEffect(() => {
    if (!livre) return undefined;
    const minuteur = setTimeout(() => effacer(), DELAI_ANNULATION_MS);
    return () => clearTimeout(minuteur);
  }, [livre, effacer]);

  if (!livre) return null;

  return (
    <View style={styles.bandeau} accessibilityRole="alert">
      <Text style={styles.texte} numberOfLines={1}>
        « {livre.titre} » supprimé
      </Text>
      <Pressable
        onPress={() => {
          annuler(livre.id);
          effacer();
        }}
        accessibilityRole="button"
        accessibilityLabel="Annuler la suppression"
        style={styles.bouton}
        hitSlop={8}
      >
        <Text style={styles.libelleBouton}>Annuler</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    position: 'absolute',
    left: theme.espacements.md,
    right: theme.espacements.md,
    bottom: theme.espacements.lg,
    backgroundColor: theme.couleurs.texte,
    borderRadius: theme.rayons.md,
    paddingVertical: theme.espacements.sm,
    paddingHorizontal: theme.espacements.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.espacements.md,
  },
  texte: { color: theme.couleurs.fond, flex: 1 },
  bouton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: theme.espacements.sm },
  libelleBouton: { color: theme.couleurs.primaire, fontWeight: '700' },
});
