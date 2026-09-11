import { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { resoudreCouverture, teinteRepli, initialesRepli } from '@/domain/couverture';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';
import { URL_BASE_API } from '@/services/api/config';

/**
 * Couverture d'un livre avec repli garanti (Lot 3) : si le champ est vide,
 * ou si l'image distante échoue au chargement, on dessine un repli local
 * (teinte + initiales) plutôt que d'afficher un cadre cassé.
 */
type Props = {
  couverture: string | null;
  idLivre: string;
  titre: string;
  largeur?: number;
};

function CouvertureBrute({ couverture, idLivre, titre, largeur = 56 }: Props) {
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);
  const [etat, setEtat] = useState({ couverturePrecedente: couverture, enEchec: false });
  if (etat.couverturePrecedente !== couverture) {
    // Le livre affiché a changé (recyclage de ligne FlatList) : on retente le
    // chargement distant plutôt que de garder l'échec du livre précédent.
    setEtat({ couverturePrecedente: couverture, enEchec: false });
  }
  const enEchec = etat.enEchec;
  const hauteur = Math.round(largeur * 1.4);

  const source = resoudreCouverture(couverture, idLivre, URL_BASE_API);
  const cadre = { width: largeur, height: hauteur, borderRadius: themeActif.rayons.sm };

  if (source.type === 'repli' || enEchec) {
    const graine = source.type === 'repli' ? source.graine : idLivre;
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.repli, cadre, { backgroundColor: `hsl(${teinteRepli(graine)}, 45%, 85%)` }]}
      >
        <Text style={styles.initiales}>{initialesRepli(titre)}</Text>
      </View>
    );
  }

  return (
    <Image
      accessibilityIgnoresInvertColors
      source={{ uri: source.url }}
      style={[styles.image, cadre]}
      contentFit="cover"
      cachePolicy="disk"
      transition={120}
      onError={() => setEtat((precedent) => ({ ...precedent, enEchec: true }))}
    />
  );
}

export const Couverture = memo(CouvertureBrute);

function creerStyles(theme: Theme) {
  return StyleSheet.create({
    repli: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.couleurs.bordure },
    image: { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.couleurs.bordure },
    initiales: { fontWeight: '700', color: theme.couleurs.texte },
  });
}
