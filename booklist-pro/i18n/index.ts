// Configuration i18next/react-i18next + bascule à chaud FR/EN.
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';
import {
  lireLanguePersistee,
  ecrireLanguePersistee,
  type PreferenceLangue,
} from '@/services/stockage/preferences';

void i18next.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

// Une fois la préférence persistée relue, on l'applique par-dessus le choix système.
// .catch() : même filet de sécurité que ThemeProvider — une lecture AsyncStorage
// en échec (stockage natif indisponible, ex. environnement de test) ne doit pas
// empêcher i18next de fonctionner avec sa langue par défaut.
void lireLanguePersistee()
  .then((langue) => {
    if (langue) void i18next.changeLanguage(langue);
  })
  .catch(() => {});

export async function changerLangue(langue: PreferenceLangue): Promise<void> {
  await i18next.changeLanguage(langue);
  await ecrireLanguePersistee(langue);
}

export default i18next;
