/**
 * Vocabulaire de recherche côté serveur (Lot 2). Filtrer, trier et paginer
 * les 500 livres est le travail du serveur — ce module ne fait que décrire
 * ce qu'on est autorisé à lui demander, jamais du filtrage local.
 */
export const CHAMPS_TRI = ['titre', 'auteur', 'annee', 'note', 'updatedAt'] as const;
export type ChampTri = (typeof CHAMPS_TRI)[number];

export const STATUTS = ['tous', 'lu', 'nonlu'] as const;
export type StatutLecture = (typeof STATUTS)[number];

export type CritereRecherche = {
  q: string;
  statut: StatutLecture;
  favorisSeulement: boolean;
  tri: ChampTri;
  ordre: 'asc' | 'desc';
};

export const CRITERES_PAR_DEFAUT: CritereRecherche = {
  q: '',
  statut: 'tous',
  favorisSeulement: false,
  tri: 'titre',
  ordre: 'asc',
};

/** Sérialise les critères en paramètres de requête pour GET /books. Fonction pure. */
export function versParametresApi(criteres: CritereRecherche, page: number, limite = 20): Record<string, string> {
  const parametres: Record<string, string> = {
    page: String(page),
    limit: String(limite),
    sort: criteres.tri,
    order: criteres.ordre,
  };
  const q = criteres.q.trim();
  if (q.length > 0) parametres.q = q;
  if (criteres.statut !== 'tous') parametres.status = criteres.statut;
  if (criteres.favorisSeulement) parametres.favori = 'true';
  return parametres;
}

export function criteresActifs(criteres: CritereRecherche): boolean {
  return criteres.q.trim().length > 0 || criteres.statut !== 'tous' || criteres.favorisSeulement;
}
