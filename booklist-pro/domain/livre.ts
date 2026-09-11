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

const ANNEE_MIN = 1450;

/** Champs qu'un libraire saisit réellement dans le formulaire d'ajout/édition. */
export const schemaSaisieLivre = z.object({
  titre: z.string().trim().min(1, 'Le titre est obligatoire').max(200, 'Titre trop long'),
  auteur: z.string().trim().min(1, "L'auteur est obligatoire").max(200, 'Auteur trop long'),
  editeur: z.string().trim().max(200, 'Éditeur trop long'),
  annee: z
    .number({ invalid_type_error: 'Année invalide' })
    .int('Année invalide')
    .min(ANNEE_MIN, 'Année invalide')
    .max(new Date().getFullYear() + 1, 'Année invalide'),
  lu: z.boolean(),
});

export type SaisieLivre = z.infer<typeof schemaSaisieLivre>;

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

