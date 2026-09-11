// Fiche détail d'un livre : notes, favori, étoiles, enrichissement OpenLibrary, couverture.
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { BoutonFavori } from '@/components/BoutonFavori';
import { Confirmation } from '@/components/Confirmation';
import { Couverture } from '@/components/Couverture';
import { EtatEcran } from '@/components/EtatEcran';
import { EtoilesNote } from '@/components/EtoilesNote';
import { estErreurApplicative, messageUtilisateur, type ErreurApplicative } from '@/domain/erreurs';
import type { Livre } from '@/domain/livre';
import { useLivre } from '@/hooks/useLivres';
import { useModifierLivrePartiel, useSupprimerLivreDifféré } from '@/hooks/useModifierLivre';
import { useAjouterNote, useNotes, useSupprimerNote } from '@/hooks/useNotes';
import { theme } from '@/theme';

// Même garde-fou que app/livres/nouveau.tsx : router.back() lève une erreur
// si l'écran a été ouvert sans historique de navigation (ex: lien direct).
function retour() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

export default function EcranFicheLivre() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requeteLivre = useLivre(id);
  const modifier = useModifierLivrePartiel();
  const { planifier } = useSupprimerLivreDifféré();
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  if (requeteLivre.isLoading) {
    return <EtatEcran statut="chargement" />;
  }

  if (requeteLivre.isError || !requeteLivre.data) {
    const erreur: ErreurApplicative = estErreurApplicative(requeteLivre.error)
      ? requeteLivre.error
      : { type: 'inconnue', message: 'Livre introuvable.' };
    return <EtatEcran statut="erreur" erreur={erreur} onReessayer={() => requeteLivre.refetch()} />;
  }

  const livre = requeteLivre.data;

  const basculer = (modifications: Partial<Pick<Livre, 'lu' | 'favori' | 'note'>>) => {
    modifier.mutate({ id: livre.id, version: livre.version, modifications });
  };

  const supprimer = () => {
    setConfirmationVisible(false);
    planifier(livre);
    retour();
  };

  return (
    <ScrollView contentContainerStyle={styles.conteneur}>
      <View style={styles.entete}>
        <Couverture couverture={livre.couverture} idLivre={livre.id} titre={livre.titre} largeur={96} />
        <View style={styles.infosEntete}>
          <Text style={styles.titre}>{livre.titre}</Text>
          <Text style={styles.auteur}>{livre.auteur}</Text>
          <Text style={styles.meta}>
            {livre.editeur ? `${livre.editeur} · ` : ''}
            {livre.annee}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/livres/nouveau', params: { id: livre.id } })}
          style={styles.boutonModifier}
          accessibilityRole="button"
          accessibilityLabel="Modifier ce livre"
          hitSlop={8}
        >
          <Text style={styles.libelleModifier}>Modifier</Text>
        </Pressable>
      </View>

      <View style={styles.ligneActions}>
        <BoutonFavori favori={livre.favori} onChange={(favori) => basculer({ favori })} desactive={modifier.isPending} />

        <View style={styles.ligneLu}>
          <Text style={styles.libelleLu}>Lu</Text>
          <Switch value={livre.lu} onValueChange={(lu) => basculer({ lu })} disabled={modifier.isPending} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.titreSection}>Note</Text>
        <EtoilesNote note={livre.note} onChange={(note) => basculer({ note })} desactive={modifier.isPending} />
      </View>

      {modifier.isError ? <Text style={styles.erreur}>{messageUtilisateur(
        estErreurApplicative(modifier.error) ? modifier.error : { type: 'inconnue', message: '' },
      )}</Text> : null}

      <SectionNotes livreId={livre.id} />

      <Pressable
        onPress={() => setConfirmationVisible(true)}
        style={styles.boutonSupprimer}
        accessibilityRole="button"
        accessibilityLabel="Supprimer ce livre"
      >
        <Text style={styles.libelleSupprimer}>Supprimer ce livre</Text>
      </Pressable>

      <Confirmation
        visible={confirmationVisible}
        titre="Supprimer ce livre ?"
        message={`« ${livre.titre} » sera retiré du fonds. Vous pourrez annuler pendant quelques secondes.`}
        libelleConfirmer="Supprimer"
        libelleAnnuler="Annuler"
        onConfirmer={supprimer}
        onAnnuler={() => setConfirmationVisible(false)}
      />
    </ScrollView>
  );
}

function SectionNotes({ livreId }: { livreId: string }) {
  const requeteNotes = useNotes(livreId);
  const ajouter = useAjouterNote(livreId);
  const supprimer = useSupprimerNote(livreId);
  const [brouillon, setBrouillon] = useState('');

  const envoyer = () => {
    const contenu = brouillon.trim();
    if (contenu.length === 0) return;
    ajouter.mutate(contenu, { onSuccess: () => setBrouillon('') });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.titreSection}>Notes de lecture</Text>

      {requeteNotes.isLoading ? <ActivityIndicator color={theme.couleurs.primaire} /> : null}

      {requeteNotes.data?.map((note) => (
        <View key={note.id} style={styles.carteNote}>
          <Text style={styles.contenuNote}>{note.contenu}</Text>
          <Pressable
            onPress={() => supprimer.mutate(note.id)}
            accessibilityRole="button"
            accessibilityLabel="Supprimer cette note"
            hitSlop={8}
          >
            <Text style={styles.supprimerNote}>Supprimer</Text>
          </Pressable>
        </View>
      ))}

      {requeteNotes.data?.length === 0 ? <Text style={styles.videNotes}>Aucune note pour l&apos;instant.</Text> : null}

      <View style={styles.ajoutNote}>
        <TextInput
          value={brouillon}
          onChangeText={setBrouillon}
          placeholder="Ajouter une note de lecture…"
          placeholderTextColor={theme.couleurs.texteAttenue}
          style={styles.saisieNote}
          multiline
          accessibilityLabel="Nouvelle note de lecture"
        />
        <Pressable
          onPress={envoyer}
          disabled={ajouter.isPending || brouillon.trim().length === 0}
          style={[styles.boutonAjoutNote, (ajouter.isPending || brouillon.trim().length === 0) && styles.boutonDesactive]}
          accessibilityRole="button"
          accessibilityLabel="Ajouter la note"
        >
          {ajouter.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.libelleAjoutNote}>Ajouter</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { padding: theme.espacements.lg, gap: theme.espacements.lg, backgroundColor: theme.couleurs.fond },
  entete: { flexDirection: 'row', gap: theme.espacements.md },
  infosEntete: { flex: 1, gap: 4, justifyContent: 'center' },
  titre: { fontSize: 20, fontWeight: '700', color: theme.couleurs.texte },
  auteur: { fontSize: 16, color: theme.couleurs.texte },
  boutonModifier: { minHeight: 44, justifyContent: 'center', paddingHorizontal: theme.espacements.sm },
  libelleModifier: { color: theme.couleurs.primaire, fontWeight: '600' },
  meta: { color: theme.couleurs.texteAttenue },
  ligneActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ligneLu: { flexDirection: 'row', alignItems: 'center', gap: theme.espacements.sm },
  libelleLu: { color: theme.couleurs.texte, fontWeight: '600' },
  section: { gap: theme.espacements.sm },
  titreSection: { fontSize: 15, fontWeight: '700', color: theme.couleurs.texte },
  erreur: { color: theme.couleurs.danger },
  carteNote: {
    backgroundColor: theme.couleurs.surface,
    borderRadius: theme.rayons.md,
    borderWidth: 1,
    borderColor: theme.couleurs.bordure,
    padding: theme.espacements.md,
    gap: theme.espacements.xs,
  },
  contenuNote: { color: theme.couleurs.texte },
  supprimerNote: { color: theme.couleurs.danger, fontWeight: '600', alignSelf: 'flex-end' },
  videNotes: { color: theme.couleurs.texteAttenue },
  ajoutNote: { gap: theme.espacements.sm },
  saisieNote: {
    borderWidth: 1,
    borderColor: theme.couleurs.bordure,
    borderRadius: theme.rayons.sm,
    padding: theme.espacements.sm,
    minHeight: 44,
    color: theme.couleurs.texte,
    backgroundColor: theme.couleurs.surface,
  },
  boutonAjoutNote: {
    backgroundColor: theme.couleurs.primaire,
    borderRadius: theme.rayons.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonDesactive: { opacity: 0.5 },
  libelleAjoutNote: { color: '#fff', fontWeight: '600' },
  boutonSupprimer: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.rayons.md,
    borderWidth: 1,
    borderColor: theme.couleurs.danger,
  },
  libelleSupprimer: { color: theme.couleurs.danger, fontWeight: '600' },
});
