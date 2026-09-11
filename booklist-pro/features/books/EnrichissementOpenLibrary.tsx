// Affichage de l'enrichissement OpenLibrary sur la fiche détail (Lot 3).
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOpenLibrary } from '@/hooks/useOpenLibrary';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

type Props = { titre: string; auteur: string };

/**
 * Dégradation silencieuse (Lot 3) : chargement et erreur/timeout ne rendent
 * rien — OpenLibrary est un service tiers non essentiel à la fiche, dont les
 * données viennent de l'API locale. Seul un résultat exploitable s'affiche,
 * qu'il ait trouvé des éditions ou non (`trouve: false` est un résultat
 * normal, pas une erreur : OpenLibrary ne connaît pas forcément l'ouvrage).
 */
export function EnrichissementOpenLibrary({ titre, auteur }: Props) {
  const { t } = useTranslation();
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);
  const requete = useOpenLibrary(titre, auteur);

  if (requete.isLoading || requete.isError || !requete.data) return null;

  if (!requete.data.trouve) {
    return <Text style={styles.texte}>{t('openLibrary.aucuneEdition')}</Text>;
  }

  const { nombreEditions, anneePremierePublication } = requete.data;

  return (
    <View style={styles.conteneur}>
      <Text style={styles.texte}>{t('openLibrary.editions', { count: nombreEditions })}</Text>
      {anneePremierePublication !== null ? (
        <Text style={styles.texte}>{t('openLibrary.premierePublication', { annee: anneePremierePublication })}</Text>
      ) : null}
    </View>
  );
}

function creerStyles(theme: Theme) {
  return StyleSheet.create({
    conteneur: { gap: 2 },
    texte: { color: theme.couleurs.texteAttenue, fontSize: 13 },
  });
}
