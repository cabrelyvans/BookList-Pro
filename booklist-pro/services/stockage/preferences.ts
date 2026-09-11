// Persistance thème/langue (AsyncStorage), derrière une interface unique.
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistance des préférences utilisateur (thème, langue).
 * Abstraction unique : personne d'autre ne doit appeler AsyncStorage
 * directement pour ces clés.
 */
const CLE_THEME = 'preferences:theme';
const CLE_LANGUE = 'preferences:langue';

export type PreferenceTheme = 'clair' | 'sombre';
export type PreferenceLangue = 'fr' | 'en';

export async function lireThemePersiste(): Promise<PreferenceTheme | null> {
  const valeur = await AsyncStorage.getItem(CLE_THEME);
  return valeur === 'clair' || valeur === 'sombre' ? valeur : null;
}

export async function ecrireThemePersiste(theme: PreferenceTheme): Promise<void> {
  await AsyncStorage.setItem(CLE_THEME, theme);
}

export async function lireLanguePersistee(): Promise<PreferenceLangue | null> {
  const valeur = await AsyncStorage.getItem(CLE_LANGUE);
  return valeur === 'fr' || valeur === 'en' ? valeur : null;
}

export async function ecrireLanguePersistee(langue: PreferenceLangue): Promise<void> {
  await AsyncStorage.setItem(CLE_LANGUE, langue);
}
