import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { STATUTS, type CritereRecherche, type StatutLecture } from '@/domain/recherche';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

type Props = { criteres: CritereRecherche; onChange: (criteres: CritereRecherche) => void };

const CLES_STATUT: Record<StatutLecture, string> = { tous: 'filtres.statutTous', lu: 'filtres.statutLus', nonlu: 'filtres.statutNonLus' };

/** Barre de recherche + filtres (Lot 2) — traduit l'intention du libraire en CritereRecherche. */
export function FiltresLivres({ criteres, onChange }: Props) {
  const { t } = useTranslation();
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);
  return (
    <View style={styles.conteneur}>
      <TextInput
        value={criteres.q}
        onChangeText={(q) => onChange({ ...criteres, q })}
        placeholder={t('filtres.rechercherPlaceholder')}
        style={styles.recherche}
        accessibilityLabel={t('filtres.rechercherPlaceholder')}
        returnKeyType="search"
      />
      <View style={styles.ligneFiltres}>
        {STATUTS.map((statut) => {
          const actif = criteres.statut === statut;
          const libelle = t(CLES_STATUT[statut]);
          return (
            <Pressable
              key={statut}
              onPress={() => onChange({ ...criteres, statut })}
              style={[styles.puce, actif && styles.puceActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
              accessibilityLabel={libelle}
            >
              <Text style={[styles.libellePuce, actif && styles.libellePuceActive]}>{libelle}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => onChange({ ...criteres, favorisSeulement: !criteres.favorisSeulement })}
          style={[styles.puce, criteres.favorisSeulement && styles.puceActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: criteres.favorisSeulement }}
          accessibilityLabel={t('filtres.favorisAccessible')}
        >
          <Text style={[styles.libellePuce, criteres.favorisSeulement && styles.libellePuceActive]}>{t('filtres.favoris')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function creerStyles(theme: Theme) {
  return StyleSheet.create({
    conteneur: { gap: theme.espacements.sm, paddingHorizontal: theme.espacements.md, paddingTop: theme.espacements.md },
    recherche: {
      borderWidth: 1,
      borderColor: theme.couleurs.bordure,
      borderRadius: theme.rayons.md,
      paddingHorizontal: theme.espacements.md,
      minHeight: 44,
      backgroundColor: theme.couleurs.surface,
      color: theme.couleurs.texte,
    },
    ligneFiltres: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.espacements.sm },
    puce: {
      paddingHorizontal: theme.espacements.md,
      minHeight: 44,
      justifyContent: 'center',
      borderRadius: theme.rayons.lg,
      backgroundColor: theme.couleurs.surface,
      borderWidth: 1,
      borderColor: theme.couleurs.bordure,
    },
    puceActive: { backgroundColor: theme.couleurs.primaire, borderColor: theme.couleurs.primaire },
    libellePuce: { color: theme.couleurs.texte, fontWeight: '600' },
    libellePuceActive: { color: theme.couleurs.surAccent },
  });
}
