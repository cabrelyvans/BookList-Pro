import { create } from 'zustand';
import type { Livre } from '@/domain/livre';

/**
 * État partagé (hors du cache serveur) du livre en cours de suppression
 * différée — permet au bandeau d'annulation de s'afficher au niveau du
 * layout racine, quel que soit l'écran depuis lequel la suppression a été
 * déclenchée (liste ou fiche détail).
 */
type EtatSuppression = {
  livre: Livre | null;
  annoncer: (livre: Livre) => void;
  effacer: () => void;
};

export const useSuppressionEnAttente = create<EtatSuppression>((set) => ({
  livre: null,
  annoncer: (livre) => set({ livre }),
  effacer: () => set({ livre: null }),
}));
