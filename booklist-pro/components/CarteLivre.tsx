import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Couverture } from './Couverture';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';
import type { Livre } from '@/domain/livre';

type Props = { livre: Livre; onPress: (id: string) => void };

/**
 * Mémoïsée pour que la frappe dans la barre de recherche (qui ne modifie pas
 * les livres déjà affichés tant que le debounce n'a pas déclenché de
 * nouvelle page) ne re-rende pas chaque ligne de la liste.
 */
function CarteLivreBrute({ livre, onPress }: Props) {
  const { t } = useTranslation();
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);
  return (
    <Pressable
      onPress={() => onPress(livre.id)}
      style={({ pressed }) => [styles.carte, pressed && styles.pressee]}
      accessibilityRole="button"
      accessibilityLabel={t('accueil.ouvrirFiche', { titre: livre.titre })}
    >
      <Couverture couverture={livre.couverture} idLivre={livre.id} titre={livre.titre} largeur={48} />
      <View style={styles.infos}>
        <Text style={styles.titre} numberOfLines={1}>
          {livre.titre}
        </Text>
        <Text style={styles.auteur}>
          {livre.auteur} · {livre.annee}
        </Text>
      </View>
      {livre.favori ? <Text style={styles.iconeFavori}>♥</Text> : null}
    </Pressable>
  );
}

export const CarteLivre = memo(CarteLivreBrute);

function creerStyles(theme: Theme) {
  return StyleSheet.create({
    carte: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.espacements.md,
      backgroundColor: theme.couleurs.surface,
      padding: theme.espacements.md,
      borderRadius: theme.rayons.md,
      borderWidth: 1,
      borderColor: theme.couleurs.bordure,
      minHeight: 44,
    },
    pressee: { opacity: 0.7 },
    infos: { flex: 1 },
    titre: { fontSize: 16, fontWeight: '600', color: theme.couleurs.texte },
    auteur: { color: theme.couleurs.texteAttenue, marginTop: 4 },
    iconeFavori: { color: theme.couleurs.danger, fontSize: 18 },
  });
}
