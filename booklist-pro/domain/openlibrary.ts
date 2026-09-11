/**
 * Enrichissement OpenLibrary (Lot 3) : nombre d'éditions + année de première
 * publication, affichés sur la fiche détail d'un livre. Types + fonction
 * pure de réduction — zéro dépendance technique, comme le reste de domain/.
 */
import { z } from 'zod';

/** Un document de résultat de recherche OpenLibrary — seuls les champs utilisés sont validés. */
export const schemaDocumentOpenLibrary = z.object({
  edition_count: z.number().optional(),
  first_publish_year: z.number().optional(),
});

export const schemaReponseOpenLibrary = z.object({
  numFound: z.number(),
  docs: z.array(schemaDocumentOpenLibrary),
});

export type ReponseOpenLibrary = z.infer<typeof schemaReponseOpenLibrary>;

/**
 * Résultat d'enrichissement une fois réduit à ce que l'écran affiche.
 * `trouve: false` (aucune édition recensée) est un résultat normal, pas une
 * erreur — OpenLibrary ne connaît pas forcément tous les ouvrages du fonds.
 */
export type EnrichissementOpenLibrary =
  | { trouve: true; nombreEditions: number; anneePremierePublication: number | null }
  | { trouve: false };

/** Fonction pure : réduit la réponse brute OpenLibrary au résultat exploitable par l'écran. */
export function versEnrichissement(reponse: ReponseOpenLibrary): EnrichissementOpenLibrary {
  const document = reponse.docs[0];
  if (!document) return { trouve: false };
  return {
    trouve: true,
    nombreEditions: document.edition_count ?? 0,
    anneePremierePublication: document.first_publish_year ?? null,
  };
}
