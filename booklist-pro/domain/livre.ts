import { z } from 'zod';

/**
 * Schéma de validation à l'exécution — chapitre 3.1 : un type TypeScript
 * ne protège de rien face à une API qui renvoie autre chose que prévu.
 */
export const schemaLivre = z.object({
  id: z.string(),
  titre: z.string(),
  auteur: z.string(),
  editeur: z.string(),
  annee: z.number(),
  lu: z.boolean(),
  favori: z.boolean(),
  note: z.number().min(0).max(5).nullable(),
  couverture: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number(),
});

export type Livre = z.infer<typeof schemaLivre>;

export const schemaPageLivres = z.object({
  items: z.array(schemaLivre),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type PageLivres = z.infer<typeof schemaPageLivres>;

/** Filtres et tri acceptés par GET /books — un seul endroit qui en connaît la forme. */
export type FiltresLivres = {
  page?: number;
  limit?: number;
  q?: string;
  status?: 'lu' | 'nonlu';
  favori?: boolean;
  sort?: 'titre' | 'auteur' | 'annee' | 'note' | 'updatedAt';
  order?: 'asc' | 'desc';
};

