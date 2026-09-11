import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { obtenirLivre } from '@/services/api/livres';
import { clesLivres } from '@/hooks/useLivres';
import { useBasculerFavori, useBasculerLu } from '@/hooks/useFavoris';
import { useSupprimerLivreDifféré } from '@/hooks/useModifierLivre';
import { EtatEcran } from '@/components/EtatEcran';
import { Couverture } from '@/components/Couverture';
import { EtoilesNote } from '@/components/EtoilesNote';
import { Confirmation } from '@/components/Confirmation';
import { FormulaireLivre } from '@/features/books/FormulaireLivre';
import { ListeNotes } from '@/features/notes/ListeNotes';
import { FormulaireNote } from '@/features/notes/FormulaireNote';
import { estErreurApplicative, type ErreurApplicative } from '@/domain/erreurs';
import { theme } from '@/theme';

export default function EcranFicheLivre() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [modeEdition, setModeEdition] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const requete = useQuery({
    queryKey: clesLivres.detail(id),
    queryFn: async ({ signal }) => {
      const resultat = await obtenirLivre(id, signal);
      if (!resultat.succes) throw resultat.erreur;
      return resultat.donnees;
    },
  });

  const basculerFavori = useBasculerFavori();
  const basculerLu = useBasculerLu();
  const { planifier } = useSupprimerLivreDifféré();

  if (requete.isLoading) return <EtatEcran statut="chargement" />;

  if (requete.isError) {
    const erreur: ErreurApplicative = estErreurApplicative(requete.error) ? requete.error : { type: 'inconnue', message: 'Erreur inattendue.' };
    return <EtatEcran statut="erreur" erreur={erreur} onReessayer={() => requete.refetch()} />;
  }

  const livre = requete.data;
  if (!livre) return <EtatEcran statut="vide" message="Cet ouvrage n'existe plus." />;

  if (modeEdition) {
    return (
      <FormulaireLivre
        livreExistant={livre}
        onReussite={() => setModeEdition(false)}
        onAnnuler={() => setModeEdition(false)}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.conteneur}>
      <View style={styles.entete}>
        <Couverture couverture={livre.couverture} idLivre={livre.id} titre={livre.titre} largeur={96} />
        <View style={styles.infosEntete}>
          <Text style={styles.titre}>{livre.titre}</Text>
          <Text style={styles.auteur}>{livre.auteur} · {livre.annee}</Text>
          <Text style={styles.editeur}>{livre.editeur}</Text>
          <EtoilesNote note={livre.note} />
          <Pressable
            onPress={() => basculerLu.mutate(livre)}
            accessibilityRole="button"
            accessibilityLabel={livre.lu ? 'Marquer comme non lu' : 'Marquer comme lu'}
            accessibilityState={{ selected: livre.lu }}
            style={[styles.badgeStatut, livre.lu && styles.badgeStatutActif]}
          >
            <Text style={[styles.libelleStatut, livre.lu && styles.libelleStatutActif]}>{livre.lu ? 'Lu' : 'Non lu'}</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => basculerFavori.mutate(livre)}
          accessibilityRole="button"
          accessibilityLabel={livre.favori ? 'Retirer des coups de cœur' : 'Ajouter aux coups de cœur'}
          accessibilityState={{ selected: livre.favori }}
          style={styles.boutonFavori}
          hitSlop={8}
        >
          <Text style={styles.iconeFavori}>{livre.favori ? '♥' : '♡'}</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => setModeEdition(true)} style={[styles.bouton, styles.boutonSecondaire]} accessibilityRole="button">
          <Text style={styles.libelleSecondaire}>Modifier</Text>
        </Pressable>
        <Pressable onPress={() => setConfirmationVisible(true)} style={[styles.bouton, styles.boutonDanger]} accessibilityRole="button">
          <Text style={styles.libelleDanger}>Supprimer</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.titreSection}>Notes de lecture</Text>
        <FormulaireNote livreId={livre.id} />
        <ListeNotes livreId={livre.id} />
      </View>

      <Confirmation
        visible={confirmationVisible}
        titre="Supprimer cet ouvrage ?"
        message={`« ${livre.titre} » sera retiré du fonds. Vous aurez 5 secondes pour annuler.`}
        libelleConfirmer="Supprimer"
        libelleAnnuler="Annuler"
        onAnnuler={() => setConfirmationVisible(false)}
        onConfirmer={() => {
          setConfirmationVisible(false);
          planifier(livre);
          router.back();
          // Le bandeau "Annulé ?" avec le bouton d'annulation (appel à `annuler(livre.id)`)
          // est prévu dans un prochain incrément — la suppression réelle est bien différée
          // de 5 secondes dès maintenant, seule l'IHM de rattrapage manque encore.
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { padding: theme.espacements.lg, gap: theme.espacements.lg },
  entete: { flexDirection: 'row', gap: theme.espacements.md },
  infosEntete: { flex: 1, gap: 4 },
  titre: { fontSize: 20, fontWeight: '700', color: theme.couleurs.texte },
  auteur: { color: theme.couleurs.texteAttenue },
  editeur: { color: theme.couleurs.texteAttenue, fontSize: 13 },
  boutonFavori: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconeFavori: { fontSize: 26, color: theme.couleurs.danger },
  badgeStatut: {
    alignSelf: 'flex-start',
    minHeight: 32,
    paddingHorizontal: theme.espacements.sm,
    justifyContent: 'center',
    borderRadius: theme.rayons.sm,
    backgroundColor: theme.couleurs.fond,
    borderWidth: 1,
    borderColor: theme.couleurs.bordure,
  },
  badgeStatutActif: { backgroundColor: theme.couleurs.succes, borderColor: theme.couleurs.succes },
  libelleStatut: { color: theme.couleurs.texteAttenue, fontWeight: '600', fontSize: 12 },
  libelleStatutActif: { color: '#fff' },
  actions: { flexDirection: 'row', gap: theme.espacements.md },
  bouton: { flex: 1, paddingVertical: theme.espacements.sm, borderRadius: theme.rayons.md, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  boutonSecondaire: { backgroundColor: theme.couleurs.fond },
  boutonDanger: { backgroundColor: theme.couleurs.danger },
  libelleSecondaire: { color: theme.couleurs.texte, fontWeight: '600' },
  libelleDanger: { color: '#fff', fontWeight: '600' },
  section: { gap: theme.espacements.sm },
  titreSection: { fontSize: 16, fontWeight: '700', color: theme.couleurs.texte },
});
