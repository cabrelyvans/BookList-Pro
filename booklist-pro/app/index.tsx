import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useLivres } from '@/hooks/useLivres';
import { EtatEcran } from '@/components/EtatEcran';
import { Couverture } from '@/components/Couverture';
import { theme } from '@/theme';
import { estErreurApplicative, type ErreurApplicative } from '@/domain/erreurs';
import type { Livre } from '@/domain/livre';

/**
 * Écran d'accueil : liste paginée du fonds.
 * Aucun fetch ici — tout passe par le hook useLivres, qui passe lui-même
 * par services/api/. C'est la règle vérifiée en revue de code.
 */
export default function EcranAccueil() {
  const [page] = useState(1);
  const requete = useLivres({ page, limit: 20 });

  if (requete.isLoading) {
    return <EtatEcran statut="chargement" />;
  }

  if (requete.isError) {
    const erreur: ErreurApplicative = estErreurApplicative(requete.error)
      ? requete.error
      : { type: 'inconnue', message: 'Erreur inattendue.' };
    return <EtatEcran statut="erreur" erreur={erreur} onReessayer={() => requete.refetch()} />;
  }

  const livres = requete.data?.items ?? [];

  return (
    <View style={styles.conteneur}>
      {livres.length === 0 ? (
        <EtatEcran statut="vide" message="Aucun ouvrage dans le fonds pour l'instant." />
      ) : (
        <FlatList
          data={livres}
          keyExtractor={(item: Livre) => item.id}
          contentContainerStyle={styles.liste}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/livres/${item.id}`)}
              style={({ pressed }) => [styles.carte, pressed && styles.cartePressee]}
              accessibilityRole="button"
              accessibilityLabel={`Ouvrir la fiche de ${item.titre}`}
            >
              <Couverture couverture={item.couverture} idLivre={item.id} titre={item.titre} largeur={48} />
              <View style={styles.infos}>
                <Text style={styles.titre} numberOfLines={1}>
                  {item.titre}
                </Text>
                <Text style={styles.auteur}>
                  {item.auteur} · {item.annee}
                </Text>
              </View>
              {item.favori ? <Text style={styles.iconeFavori}>♥</Text> : null}
            </Pressable>
          )}
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
  cartePressee: { opacity: 0.7 },
  infos: { flex: 1 },
  titre: { fontSize: 16, fontWeight: '600', color: theme.couleurs.texte },
  auteur: { color: theme.couleurs.texteAttenue, marginTop: 4 },
  iconeFavori: { color: theme.couleurs.danger, fontSize: 18 },
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
