// Tokens de design : couleurs, espacements, rayons — thème clair + sombre.
type Theme = {
  couleurs: {
    primaire: string;
    danger: string;
    succes: string;
    texte: string;
    texteAttenue: string;
    fond: string;
    surface: string;
    bordure: string;
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
  },
};
