import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useLivresInfini } from '@/hooks/useLivres';
import { EtatEcran } from '@/components/EtatEcran';
import { CarteLivre } from '@/components/CarteLivre';
import { FiltresLivres } from '@/features/books/FiltresLivres';
import { theme } from '@/theme';
import { estErreurApplicative, type ErreurApplicative } from '@/domain/erreurs';
import { CRITERES_PAR_DEFAUT, criteresActifs, type CritereRecherche } from '@/domain/recherche';

/**
 * Écran d'accueil : liste paginée du fonds, chargée par scroll infini.
 * Aucun fetch ici — tout passe par le hook useLivres, qui passe lui-même
 * par services/api/. C'est la règle vérifiée en revue de code.
 */
export default function EcranAccueil() {
  const [criteres, setCriteres] = useState<CritereRecherche>(CRITERES_PAR_DEFAUT);
  const requete = useLivresInfini(criteres);

  if (requete.isLoading) {
    return <EtatEcran statut="chargement" />;
  }

  if (requete.isError) {
    const erreur: ErreurApplicative = estErreurApplicative(requete.error)
      ? requete.error
      : { type: 'inconnue', message: 'Erreur inattendue.' };
    return <EtatEcran statut="erreur" erreur={erreur} onReessayer={() => requete.refetch()} />;
  }

  const livres = requete.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={styles.conteneur}>
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
              <ActivityIndicator style={styles.chargementSuite} color={theme.couleurs.primaire} />
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

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: theme.couleurs.fond },
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
  libelleAjout: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
