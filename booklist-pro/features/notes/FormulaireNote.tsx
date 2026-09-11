// Ajout d'une note de lecture.
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAjouterNote } from '@/hooks/useNotes';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

export function FormulaireNote({ livreId }: { livreId: string }) {
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);
  const ajouter = useAjouterNote(livreId);
  const [brouillon, setBrouillon] = useState('');

  const envoyer = () => {
    const contenu = brouillon.trim();
    if (contenu.length === 0) return;
    ajouter.mutate(contenu, { onSuccess: () => setBrouillon('') });
  };

  return (
    <View style={styles.ajoutNote}>
      <TextInput
        value={brouillon}
        onChangeText={setBrouillon}
        placeholder="Ajouter une note de lecture…"
        placeholderTextColor={themeActif.couleurs.texteAttenue}
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
        {ajouter.isPending ? (
          <ActivityIndicator color={themeActif.couleurs.surAccent} />
        ) : (
          <Text style={styles.libelleAjoutNote}>Ajouter</Text>
        )}
      </Pressable>
    </View>
  );
}

function creerStyles(theme: Theme) {
  return StyleSheet.create({
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
    libelleAjoutNote: { color: theme.couleurs.surAccent, fontWeight: '600' },
  });
}
