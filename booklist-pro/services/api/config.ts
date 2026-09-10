import { Platform } from 'react-native';

/**
 * Seul endroit qui connaît l'URL de l'API.
 * Sur le web (navigateur), localhost fonctionne directement.
 * Sur mobile (Expo Go), il faut l'IP locale de la machine qui fait tourner l'API —
 * à surcharger ici pendant les tests sur téléphone.
 */
const URL_PAR_DEFAUT = Platform.select({
  web: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const URL_BASE_API = URL_PAR_DEFAUT ?? 'http://localhost:3000';

export const DELAI_EXPIRATION_MS = 8000;
