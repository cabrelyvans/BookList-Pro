import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useLivresInfini } from '@/hooks/useLivres';
import { useTheme } from '@/hooks/useTheme';
import { EtatEcran } from '@/components/EtatEcran';
import { CarteLivre } from '@/components/CarteLivre';
import { FiltresLivres } from '@/features/books/FiltresLivres';
import type { Theme } from '@/theme';
import { estErreurApplicative, type ErreurApplicative } from '@/domain/erreurs';
import { CRITERES_PAR_DEFAUT, criteresActifs, type CritereRecherche } from '@/domain/recherche';

/**
 * Écran d'accueil : liste paginée du fonds, chargée par scroll infini.
 * Aucun fetch ici — tout passe par le hook useLivres, qui passe lui-même
 * par services/api/. C'est la règle vérifiée en revue de code.
 */
export default function EcranAccueil() {
  const { themeActif, preference, basculerTheme } = useTheme();
  const styles = creerStyles(themeActif);
  const [criteres, setCriteres] = useState<CritereRecherche>(CRITERES_PAR_DEFAUT);
  const requete = useLivresInfini(criteres);

  const enTete = (
    <View style={styles.enTete}>
      <Pressable
        onPress={basculerTheme}
        style={styles.boutonTheme}
        accessibilityRole="button"
        accessibilityLabel={preference === 'sombre' ? 'Passer au thème clair' : 'Passer au thème sombre'}
        hitSlop={8}
      >
        <Text style={styles.libelleBoutonTheme}>{preference === 'sombre' ? '☀️' : '🌙'}</Text>
      </Pressable>
    </View>
  );

  if (requete.isLoading) {
    return (
      <View style={styles.conteneur}>
        {enTete}
        <EtatEcran statut="chargement" />
      </View>
    );
  }

  if (requete.isError) {
    const erreur: ErreurApplicative = estErreurApplicative(requete.error)
      ? requete.error
      : { type: 'inconnue', message: 'Erreur inattendue.' };
    return (
      <View style={styles.conteneur}>
        {enTete}
        <EtatEcran statut="erreur" erreur={erreur} onReessayer={() => requete.refetch()} />
      </View>
    );
  }

  const livres = requete.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={styles.conteneur}>
      {enTete}
      <FiltresLivres criteres={criteres} onChange={setCriteres} />

      {livres.length === 0 ? (
        <EtatEcran
          statut="vide"
          message={
            criteresActifs(criteres)
              ? 'Aucun ouvrage ne correspond à ces critères.'
              : 'Rien pour l’instant — ajoute ton premier ouvrage.'
          }
        />
      ) : (
        <FlatList
          data={livres}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.liste}
          onEndReached={() => {
            if (requete.hasNextPage && !requete.isFetchingNextPage) {
              void requete.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            requete.isFetchingNextPage ? (
              <ActivityIndicator style={styles.chargementSuite} color={themeActif.couleurs.primaire} />
            ) : null
          }
          renderItem={({ item }) => <CarteLivre livre={item} onPress={(id) => router.push(`/livres/${id}`)} />}
        />
      )}

      <Pressable
        onPress={() => router.push('/livres/nouveau')}
        style={styles.boutonAjout}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un ouvrage"
      >
        <Text style={styles.libelleAjout}>+</Text>
      </Pressable>
    </View>
  );
}

function creerStyles(theme: Theme) {
  return StyleSheet.create({
    conteneur: { flex: 1, backgroundColor: theme.couleurs.fond },
    enTete: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: theme.espacements.md, paddingTop: theme.espacements.sm },
    boutonTheme: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    libelleBoutonTheme: { fontSize: 20 },
    liste: { padding: theme.espacements.md, gap: theme.espacements.sm, paddingBottom: 88 },
    chargementSuite: { marginVertical: theme.espacements.md },
    boutonAjout: {
      position: 'absolute',
      right: theme.espacements.lg,
      bottom: theme.espacements.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.couleurs.primaire,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
    libelleAjout: { color: theme.couleurs.surAccent, fontSize: 28, lineHeight: 30 },
  });
}
