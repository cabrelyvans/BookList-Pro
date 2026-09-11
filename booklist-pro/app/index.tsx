import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useLivresInfini } from '@/hooks/useLivres';
import { useDebounce } from '@/hooks/useDebounce';
import { EtatEcran } from '@/components/EtatEcran';
import { CarteLivre } from '@/components/CarteLivre';
import { FiltresLivres } from '@/features/books/FiltresLivres';
import { theme } from '@/theme';
import { estErreurApplicative, type ErreurApplicative } from '@/domain/erreurs';
import { CRITERES_PAR_DEFAUT, type CritereRecherche } from '@/domain/recherche';
import type { Livre } from '@/domain/livre';

/**
 * Écran d'accueil : recherche/filtres/tri serveur (Lot 2) + défilement
 * infini. Aucun filtrage local — chaque changement de critère déclenche une
 * nouvelle page demandée au serveur, avec anti-rebond sur la recherche
 * textuelle pour ne pas spammer l'API à chaque frappe.
 */
export default function EcranAccueil() {
  const [criteres, setCriteres] = useState<CritereRecherche>(CRITERES_PAR_DEFAUT);
  const critèresDifferes = useDebounce(criteres, 300);

  const requete = useLivresInfini(critèresDifferes);

  if (requete.isLoading) {
    return <EtatEcran statut="chargement" />;
  }

  if (requete.isError) {
    const erreur: ErreurApplicative = estErreurApplicative(requete.error)
      ? requete.error
      : { type: 'inconnue', message: 'Erreur inattendue.' };
    return <EtatEcran statut="erreur" erreur={erreur} onReessayer={() => requete.refetch()} />;
  }

  const livres: Livre[] = requete.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={styles.conteneur}>
      <FiltresLivres criteres={criteres} onChange={setCriteres} />

      {livres.length === 0 ? (
        <EtatEcran statut="vide" message="Aucun ouvrage ne correspond à ces critères." />
      ) : (
        <FlatList
          data={livres}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.liste}
          renderItem={({ item }) => <CarteLivre livre={item} onPress={(id) => router.push(`/livres/${id}`)} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (requete.hasNextPage && !requete.isFetchingNextPage) {
              void requete.fetchNextPage();
            }
          }}
          ListFooterComponent={
            requete.isFetchingNextPage ? (
              <ActivityIndicator style={styles.chargementSuivant} color={theme.couleurs.primaire} accessibilityLabel="Chargement de la page suivante" />
            ) : null
          }
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
  chargementSuivant: { paddingVertical: theme.espacements.lg },
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
