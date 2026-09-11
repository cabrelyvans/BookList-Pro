import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { schemaSaisieLivre, type Livre, type SaisieLivre } from '@/domain/livre';
import { useCreerLivre, useMettreAJourLivre, estErreur422 } from '@/hooks/useModifierLivre';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

type Props = {
  /** Absent = création. Présent = édition de ce livre précis. */
  livreExistant?: Livre;
  onReussite: (livre: Livre) => void;
  onAnnuler: () => void;
};

const VALEURS_PAR_DEFAUT: SaisieLivre = { titre: '', auteur: '', editeur: '', annee: new Date().getFullYear(), lu: false };

/**
 * Formulaire d'ajout/édition (Lot 1). Validation typée avec zod, message par
 * champ, bouton désactivé pendant l'envoi, erreurs 422 de l'API redirigées
 * vers le bon champ plutôt qu'affichées en bloc.
 */
export function FormulaireLivre({ livreExistant, onReussite, onAnnuler }: Props) {
  const { t } = useTranslation();
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);
  const creer = useCreerLivre();
  const mettreAJour = useMettreAJourLivre();
  const enCours = creer.isPending || mettreAJour.isPending;

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SaisieLivre>({
    resolver: zodResolver(schemaSaisieLivre),
    defaultValues: livreExistant
      ? { titre: livreExistant.titre, auteur: livreExistant.auteur, editeur: livreExistant.editeur, annee: livreExistant.annee, lu: livreExistant.lu }
      : VALEURS_PAR_DEFAUT,
  });

  // Si l'API renvoie une 422, on redirige chaque message vers son champ.
  useEffect(() => {
    const erreur = creer.error ?? mettreAJour.error;
    if (estErreur422(erreur)) {
      for (const [champ, message] of Object.entries(erreur.champs)) {
        if (champ in VALEURS_PAR_DEFAUT) {
          setError(champ as keyof SaisieLivre, { type: 'server', message });
        }
      }
    }
  }, [creer.error, mettreAJour.error, setError]);

  const soumettre = handleSubmit((saisie) => {
    if (livreExistant) {
      mettreAJour.mutate({ livre: livreExistant, saisie }, { onSuccess: onReussite });
    } else {
      creer.mutate(saisie, { onSuccess: onReussite });
    }
  });

  const erreurGlobale = [creer.error, mettreAJour.error].find((erreur) => erreur && !estErreur422(erreur));

  return (
    <View style={styles.conteneur}>
      <Champ label={t('livre.titre')} erreur={errors.titre?.message}>
        <Controller
          control={control}
          name="titre"
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              style={styles.saisie}
              accessibilityLabel={t('livre.titre')}
              editable={!enCours}
            />
          )}
        />
      </Champ>

      <Champ label={t('livre.auteur')} erreur={errors.auteur?.message}>
        <Controller
          control={control}
          name="auteur"
          render={({ field }) => (
            <TextInput value={field.value} onChangeText={field.onChange} style={styles.saisie} accessibilityLabel={t('livre.auteur')} editable={!enCours} />
          )}
        />
      </Champ>

      <Champ label={t('livre.editeur')} erreur={errors.editeur?.message}>
        <Controller
          control={control}
          name="editeur"
          render={({ field }) => (
            <TextInput value={field.value} onChangeText={field.onChange} style={styles.saisie} accessibilityLabel={t('livre.editeur')} editable={!enCours} />
          )}
        />
      </Champ>

      <Champ label={t('livre.annee')} erreur={errors.annee?.message}>
        <Controller
          control={control}
          name="annee"
          render={({ field }) => (
            <TextInput
              value={String(field.value)}
              onChangeText={(texte) => field.onChange(Number.parseInt(texte, 10) || 0)}
              keyboardType="numeric"
              style={styles.saisie}
              accessibilityLabel={t('livre.annee')}
              editable={!enCours}
            />
          )}
        />
      </Champ>

      <Controller
        control={control}
        name="lu"
        render={({ field }) => (
          <View style={styles.ligneInterrupteur}>
            <Text style={styles.libelleInterrupteur}>{t('formulaire.dejaLu')}</Text>
            <Switch value={field.value} onValueChange={field.onChange} disabled={enCours} accessibilityLabel={t('formulaire.dejaLu')} />
          </View>
        )}
      />

      {erreurGlobale ? <Text style={styles.erreurGlobale}>{erreurGlobale.message}</Text> : null}

      <View style={styles.actions}>
        <Pressable onPress={onAnnuler} disabled={enCours} style={[styles.bouton, styles.boutonSecondaire]} accessibilityRole="button">
          <Text style={styles.libelleSecondaire}>{t('formulaire.annuler')}</Text>
        </Pressable>
        <Pressable onPress={soumettre} disabled={enCours} style={[styles.bouton, styles.boutonPrimaire]} accessibilityRole="button">
          {enCours ? <ActivityIndicator color={themeActif.couleurs.surAccent} /> : <Text style={styles.libellePrimaire}>{t('formulaire.enregistrer')}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

// Sous-composant de présentation pure, propre à ce formulaire — son propre
// useTheme() plutôt qu'un `styles` reçu en prop depuis FormulaireLivre :
// StyleSheet.create ne peut pas être dynamique, donc chaque composant qui
// a besoin du thème le relit lui-même (lecture de contexte, pas de calcul
// coûteux).
function Champ({ label, erreur, children }: { label: string; erreur?: string; children: React.ReactNode }) {
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);
  return (
    <View style={styles.champ}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {erreur ? <Text style={styles.erreurChamp}>{erreur}</Text> : null}
    </View>
  );
}

function creerStyles(theme: Theme) {
  return StyleSheet.create({
    conteneur: { gap: theme.espacements.md, padding: theme.espacements.lg },
    champ: { gap: theme.espacements.xs },
    label: { fontWeight: '600', color: theme.couleurs.texte },
    saisie: {
      borderWidth: 1,
      borderColor: theme.couleurs.bordure,
      borderRadius: theme.rayons.sm,
      paddingHorizontal: theme.espacements.sm,
      minHeight: 44,
      color: theme.couleurs.texte,
      backgroundColor: theme.couleurs.surface,
    },
    erreurChamp: { color: theme.couleurs.danger, fontSize: 13 },
    erreurGlobale: { color: theme.couleurs.danger, textAlign: 'center' },
    ligneInterrupteur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
    libelleInterrupteur: { color: theme.couleurs.texte, fontWeight: '600' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.espacements.md, marginTop: theme.espacements.sm },
    bouton: { paddingHorizontal: theme.espacements.lg, paddingVertical: theme.espacements.sm, borderRadius: theme.rayons.md, minHeight: 44, justifyContent: 'center', minWidth: 100, alignItems: 'center' },
    boutonSecondaire: { backgroundColor: theme.couleurs.fond },
    boutonPrimaire: { backgroundColor: theme.couleurs.primaire },
    libelleSecondaire: { color: theme.couleurs.texte, fontWeight: '600' },
    libellePrimaire: { color: theme.couleurs.surAccent, fontWeight: '600' },
  });
}
