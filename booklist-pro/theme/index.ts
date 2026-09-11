// Tokens de design : couleurs, espacements, rayons — thème clair + sombre.
// Exporté (pas seulement utilisé en interne) : creerStyles(theme: Theme)
// dans chaque écran/composant qui suit useTheme() en a besoin pour typer
// son paramètre — StyleSheet.create ne peut pas être dynamique, donc les
// styles se construisent à l'intérieur du composant, avec themeActif.
export type Theme = {
  couleurs: {
    primaire: string;
    danger: string;
    succes: string;
    texte: string;
    texteAttenue: string;
    fond: string;
    surface: string;
    bordure: string;
    // Texte/icônes posés sur un fond saturé (bouton primaire ou danger) —
    // blanc dans les deux thèmes ici, mais un token à part entière plutôt
    // qu'un '#fff' recopié dans chaque fichier : un seul endroit à changer
    // si ça doit diverger un jour entre clair et sombre.
    surAccent: string;
    // Voile semi-transparent derrière une modale (Confirmation).
    voile: string;
  };
  espacements: { xs: number; sm: number; md: number; lg: number; xl: number };
  rayons: { sm: number; md: number; lg: number };
};

export const theme: Theme = {
  couleurs: {
    primaire: '#2563eb',
    danger: '#dc2626',
    succes: '#16a34a',
    texte: '#111827',
    texteAttenue: '#6b7280',
    fond: '#f9fafb',
    surface: '#ffffff',
    bordure: '#e5e7eb',
    surAccent: '#ffffff',
    voile: 'rgba(0, 0, 0, 0.45)',
  },
  espacements: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  rayons: { sm: 6, md: 12, lg: 20 },
};

export const themeSombre: Theme = {
  ...theme,
  couleurs: {
    primaire: '#3b82f6',
    danger: '#f87171',
    succes: '#4ade80',
    texte: '#f9fafb',
    texteAttenue: '#9ca3af',
    fond: '#111827',
    surface: '#1f2937',
    bordure: '#374151',
    surAccent: '#ffffff',
    voile: 'rgba(0, 0, 0, 0.6)',
  },
};
