import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useLivres } from '@/hooks/useLivres';
import { EtatEcran } from '@/components/EtatEcran';
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

  if (livres.length === 0) {
    return <EtatEcran statut="vide" message="Aucun ouvrage dans le fonds pour l'instant." />;
  }

  return (
    <EtatEcran statut="succes">
      <FlatList
        data={livres}
        keyExtractor={(item: Livre) => item.id}
        contentContainerStyle={styles.liste}
        renderItem={({ item }) => (
          <View style={styles.carte}>
            <Text style={styles.titre}>{item.titre}</Text>
            <Text style={styles.auteur}>
              {item.auteur} · {item.annee}
            </Text>
          </View>
        )}
      />
    </EtatEcran>
  );
}

const styles = StyleSheet.create({
  liste: { padding: theme.espacements.md, gap: theme.espacements.sm },
  carte: {
    backgroundColor: theme.couleurs.surface,
    padding: theme.espacements.md,
    borderRadius: theme.rayons.md,
    borderWidth: 1,
    borderColor: theme.couleurs.bordure,
  },
  titre: { fontSize: 16, fontWeight: '600', color: theme.couleurs.texte },
  auteur: { color: theme.couleurs.texteAttenue, marginTop: 4 },
});
