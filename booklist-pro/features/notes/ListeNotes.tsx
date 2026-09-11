// Affichage horodaté des notes de lecture d'un livre.
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNotes, useSupprimerNote } from '@/hooks/useNotes';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

export function ListeNotes({ livreId }: { livreId: string }) {
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);
  const requeteNotes = useNotes(livreId);
  const supprimer = useSupprimerNote(livreId);

  return (
    <>
      {requeteNotes.isLoading ? <ActivityIndicator color={themeActif.couleurs.primaire} /> : null}

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
    </>
  );
}

function creerStyles(theme: Theme) {
  return StyleSheet.create({
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
  });
}
