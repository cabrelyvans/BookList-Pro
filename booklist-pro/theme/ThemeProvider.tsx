import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { theme, themeSombre } from './index';
import {
  lireThemePersiste,
  ecrireThemePersiste,
  type PreferenceTheme,
} from '@/services/stockage/preferences';

type ContexteTheme = {
  themeActif: typeof theme;
  preference: PreferenceTheme;
  basculerTheme: () => void;
};

const ContexteThemeApp = createContext<ContexteTheme | null>(null);

/**
 * Bascule manuelle clair/sombre, respect de la préférence système par
 * défaut au premier lancement, persistance du choix explicite ensuite.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const schemeSysteme = useColorScheme();
  const [preference, setPreference] = useState<PreferenceTheme>(
    schemeSysteme === 'dark' ? 'sombre' : 'clair',
  );

  useEffect(() => {
    let annule = false;
    lireThemePersiste().then((valeur) => {
      if (!annule && valeur) setPreference(valeur);
    });
    return () => {
      annule = true;
    };
  }, []);

  const basculerTheme = () => {
    setPreference((actuel) => {
      const nouveau: PreferenceTheme = actuel === 'clair' ? 'sombre' : 'clair';
      ecrireThemePersiste(nouveau).catch(() => {
        // La persistance a échoué (stockage plein/indisponible) : la session
        // en cours garde le nouveau thème en mémoire, seul le prochain
        // démarrage retombera sur la préférence système.
      });
      return nouveau;
    });
  };

  const valeur = useMemo<ContexteTheme>(
    () => ({
      themeActif: preference === 'sombre' ? themeSombre : theme,
      preference,
      basculerTheme,
    }),
    [preference],
  );

  return <ContexteThemeApp.Provider value={valeur}>{children}</ContexteThemeApp.Provider>;
}

export function useTheme(): ContexteTheme {
  const contexte = useContext(ContexteThemeApp);
  if (!contexte) {
    throw new Error('useTheme doit être utilisé à l’intérieur de <ThemeProvider>');
  }
  return contexte;
}
