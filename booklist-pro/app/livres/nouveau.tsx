import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EtatEcran } from '@/components/EtatEcran';
import { estErreurApplicative, type ErreurApplicative } from '@/domain/erreurs';
import { FormulaireLivre } from '@/features/books/FormulaireLivre';
import { useLivre } from '@/hooks/useLivres';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

// Si l'écran a été ouvert directement (rechargement de page sur le web,
// lien partagé) il n'y a pas d'historique de navigation : router.back()
// lève alors "GO_BACK was not handled". On retombe sur la liste dans ce cas.
function retour() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

/**
 * Écran unique pour créer ET modifier un livre (CRUD complet, partie U) :
 * `?id=` présent → édition (le formulaire est pré-rempli avec le livre
 * existant) ; absent → création. Évite de dupliquer FormulaireLivre.
 */
export default function EcranFormulaireLivre() {
  const { t } = useTranslation();
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const requeteLivre = useLivre(id);

  if (id) {
    if (requeteLivre.isLoading) {
      return <EtatEcran statut="chargement" />;
    }
    if (requeteLivre.isError || !requeteLivre.data) {
      const erreur: ErreurApplicative = estErreurApplicative(requeteLivre.error)
        ? requeteLivre.error
        : { type: 'inconnue', message: t('fiche.introuvable') };
      return <EtatEcran statut="erreur" erreur={erreur} onReessayer={() => requeteLivre.refetch()} />;
    }
  }

  const livreExistant = id ? requeteLivre.data : undefined;

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>{t(livreExistant ? 'formulaire.titreModification' : 'formulaire.titreAjout')}</Text>
      <FormulaireLivre livreExistant={livreExistant} onReussite={retour} onAnnuler={retour} />
    </View>
  );
}

function creerStyles(theme: Theme) {
  return StyleSheet.create({
    conteneur: { flex: 1, backgroundColor: theme.couleurs.fond },
    titre: { fontSize: 20, fontWeight: '700', color: theme.couleurs.texte, padding: theme.espacements.lg, paddingBottom: 0 },
  });
}
