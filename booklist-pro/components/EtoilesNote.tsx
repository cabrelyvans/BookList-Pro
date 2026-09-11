// Interaction par étoiles (note de 0 à 5) — composant pur.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

/**
 * Note interne de 0 à 5 par interaction d'étoiles (Lot 3).
 * Chaque étoile est son propre bouton de 44 points (accessibilité tactile),
 * avec un rôle "radio" pour la navigation au clavier/lecteur d'écran.
 */
type Props = {
  note: number | null;
  onChange?: (note: number) => void;
  desactive?: boolean;
};

const VALEURS = [1, 2, 3, 4, 5] as const;

export function EtoilesNote({ note, onChange, desactive }: Props) {
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);

  if (!onChange) {
    // Lecture seule (ex: carte dans une liste)
    return (
      <Text style={styles.lecture}>
        {note === null ? '—' : '★'.repeat(Math.round(note)) + '☆'.repeat(5 - Math.round(note))}
      </Text>
    );
  }

  return (
    <View style={styles.rangee} accessibilityRole="radiogroup">
      {VALEURS.map((valeur) => {
        const plein = note !== null && valeur <= Math.round(note);
        return (
          <Pressable
            key={valeur}
            accessibilityRole="radio"
            accessibilityLabel={`${valeur} étoile${valeur > 1 ? 's' : ''}`}
            accessibilityState={{ checked: plein, disabled: desactive === true }}
            disabled={desactive}
            onPress={() => onChange(valeur)}
            style={({ pressed }) => [styles.etoile, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.symbole, { color: plein ? themeActif.couleurs.primaire : themeActif.couleurs.texteAttenue }]}>
              {plein ? '★' : '☆'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function creerStyles(theme: Theme) {
  return StyleSheet.create({
    rangee: { flexDirection: 'row', alignItems: 'center' },
    lecture: { fontSize: 16, color: theme.couleurs.primaire },
    etoile: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    symbole: { fontSize: 22 },
  });
}
