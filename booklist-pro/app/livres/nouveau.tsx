import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FormulaireLivre } from '@/features/books/FormulaireLivre';
import { theme } from '@/theme';

export default function EcranNouveauLivre() {
  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>Ajouter un ouvrage</Text>
      <FormulaireLivre onReussite={() => router.back()} onAnnuler={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: theme.couleurs.fond },
  titre: { fontSize: 20, fontWeight: '700', color: theme.couleurs.texte, padding: theme.espacements.lg, paddingBottom: 0 },
});
