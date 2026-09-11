// Fiche détail d'un livre : notes, favori, étoiles, enrichissement OpenLibrary, couverture.
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BoutonFavori } from '@/components/BoutonFavori';
import { Confirmation } from '@/components/Confirmation';
import { Couverture } from '@/components/Couverture';
import { EtatEcran } from '@/components/EtatEcran';
import { EtoilesNote } from '@/components/EtoilesNote';
import { estErreurApplicative, messageUtilisateur, type ErreurApplicative } from '@/domain/erreurs';
import type { Livre } from '@/domain/livre';
import { FormulaireNote } from '@/features/notes/FormulaireNote';
import { ListeNotes } from '@/features/notes/ListeNotes';
import { useLivre } from '@/hooks/useLivres';
import { useModifierLivrePartiel, useSupprimerLivreDifféré } from '@/hooks/useModifierLivre';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

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
  const { t } = useTranslation();
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);
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
      : { type: 'inconnue', message: t('fiche.introuvable') };
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
          accessibilityLabel={t('fiche.modifierAccessible')}
          hitSlop={8}
        >
          <Text style={styles.libelleModifier}>{t('fiche.modifier')}</Text>
        </Pressable>
      </View>

      <View style={styles.ligneActions}>
        <BoutonFavori favori={livre.favori} onChange={(favori) => basculer({ favori })} desactive={modifier.isPending} />

        <View style={styles.ligneLu}>
          <Text style={styles.libelleLu}>{t('fiche.lu')}</Text>
          <Switch value={livre.lu} onValueChange={(lu) => basculer({ lu })} disabled={modifier.isPending} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.titreSection}>{t('fiche.note')}</Text>
        <EtoilesNote note={livre.note} onChange={(note) => basculer({ note })} desactive={modifier.isPending} />
      </View>

      {modifier.isError ? <Text style={styles.erreur}>{messageUtilisateur(
        estErreurApplicative(modifier.error) ? modifier.error : { type: 'inconnue', message: '' },
      )}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.titreSection}>{t('fiche.notesLecture')}</Text>
        <ListeNotes livreId={livre.id} />
        <FormulaireNote livreId={livre.id} />
      </View>

      <Pressable
        onPress={() => setConfirmationVisible(true)}
        style={styles.boutonSupprimer}
        accessibilityRole="button"
        accessibilityLabel={t('fiche.supprimer')}
      >
        <Text style={styles.libelleSupprimer}>{t('fiche.supprimer')}</Text>
      </Pressable>

      <Confirmation
        visible={confirmationVisible}
        titre={t('confirmationSuppression.titre')}
        message={t('confirmationSuppression.message', { titre: livre.titre })}
        libelleConfirmer={t('confirmationSuppression.confirmer')}
        libelleAnnuler={t('confirmationSuppression.annuler')}
        onConfirmer={supprimer}
        onAnnuler={() => setConfirmationVisible(false)}
      />
    </ScrollView>
  );
}

function creerStyles(theme: Theme) {
  return StyleSheet.create({
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
}
