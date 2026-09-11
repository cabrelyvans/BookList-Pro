// Icône cœur avec bascule — reçoit l'état et le gestionnaire en props, ne connaît pas l'API.
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '@/theme';

type Props = {
  favori: boolean;
  onChange: (favori: boolean) => void;
  desactive?: boolean;
};

export function BoutonFavori({ favori, onChange, desactive }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      accessibilityState={{ checked: favori, disabled: desactive === true }}
      disabled={desactive}
      onPress={() => onChange(!favori)}
      style={({ pressed }) => [styles.bouton, pressed && { opacity: 0.6 }]}
      hitSlop={8}
    >
      <Text style={[styles.icone, { color: favori ? theme.couleurs.danger : theme.couleurs.texteAttenue }]}>
        {favori ? '♥' : '♡'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  icone: { fontSize: 26 },
});
