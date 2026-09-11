// Aides partagées par les tests de composants — évite de dupliquer le même
// wrapper <ThemeProvider> dans chaque fichier de test.
import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ThemeProvider } from '@/theme/ThemeProvider';
// Effet de bord : initialise i18next. Sans cet import, useTranslation() dans
// les composants sous test retombe sur la clé brute au lieu du texte traduit.
import '@/i18n';

/** Rendu avec le contexte thème disponible — nécessaire pour tout composant qui appelle useTheme(). */
export function rendreAvecTheme(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: ThemeProvider, ...options });
}
