import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

/**
 * Boîte de confirmation avant une action destructive (Lot 1 : suppression).
 * La fenêtre d'annulation de 5 secondes qui suit est gérée ailleurs — une
 * confirmation seule n'est pas un filet de sécurité suffisant.
 */
type Props = {
  visible: boolean;
  titre: string;
  message: string;
  libelleConfirmer: string;
  libelleAnnuler: string;
  onConfirmer: () => void;
  onAnnuler: () => void;
};

export function Confirmation({ visible, titre, message, libelleConfirmer, libelleAnnuler, onConfirmer, onAnnuler }: Props) {
  const { themeActif } = useTheme();
  const styles = creerStyles(themeActif);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAnnuler}>
      <Pressable style={styles.voile} onPress={onAnnuler} accessibilityLabel={libelleAnnuler}>
        <Pressable
          accessibilityViewIsModal
          accessibilityRole="alert"
          onPress={(evenement) => evenement.stopPropagation()}
          style={styles.boite}
        >
          <Text style={styles.titre}>{titre}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable onPress={onAnnuler} style={[styles.bouton, styles.boutonSecondaire]} accessibilityRole="button">
              <Text style={styles.libelleSecondaire}>{libelleAnnuler}</Text>
            </Pressable>
            <Pressable onPress={onConfirmer} style={[styles.bouton, styles.boutonDanger]} accessibilityRole="button">
              <Text style={styles.libelleDanger}>{libelleConfirmer}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function creerStyles(theme: Theme) {
  return StyleSheet.create({
    voile: { flex: 1, backgroundColor: theme.couleurs.voile, alignItems: 'center', justifyContent: 'center', padding: theme.espacements.lg },
    boite: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.couleurs.surface,
      borderRadius: theme.rayons.lg,
      padding: theme.espacements.xl,
      gap: theme.espacements.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.couleurs.bordure,
    },
    titre: { fontSize: 17, fontWeight: '700', color: theme.couleurs.texte },
    message: { color: theme.couleurs.texteAttenue },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.espacements.md, marginTop: theme.espacements.sm },
    bouton: { paddingHorizontal: theme.espacements.lg, paddingVertical: theme.espacements.sm, borderRadius: theme.rayons.md, minHeight: 44, justifyContent: 'center' },
    boutonSecondaire: { backgroundColor: theme.couleurs.fond },
    boutonDanger: { backgroundColor: theme.couleurs.danger },
    libelleSecondaire: { color: theme.couleurs.texte, fontWeight: '600' },
    libelleDanger: { color: theme.couleurs.surAccent, fontWeight: '600' },
  });
}
