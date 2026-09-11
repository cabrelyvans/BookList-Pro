import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { listerLivres, obtenirLivre } from '@/services/api/livres';
import type { FiltresLivres } from '@/domain/livre';

/** Clé de cache structurée — voir ADR 001. */
export const clesLivres = {
  tous: ['livres'] as const,
  liste: (filtres: FiltresLivres) => [...clesLivres.tous, 'liste', filtres] as const,
  recherche: (criteres: CritereRecherche) => [...clesLivres.tous, 'recherche', criteres] as const,
  detail: (id: string) => [...clesLivres.tous, 'detail', id] as const,
};

/** Conservé pour un usage ponctuel (une seule page, sans défilement infini). */
export function useLivres(filtres: FiltresLivres) {
  return useQuery({
    queryKey: clesLivres.liste(filtres),
    queryFn: async ({ signal }) => {
      const resultat = await listerLivres(filtres, signal);
      if (!resultat.succes) throw resultat.erreur;
      return resultat.donnees;
    },
  });
}

/**
 * Fiche détail d'un livre. `id` optionnel pour les écrans qui servent aussi
 * en mode création (ex: le formulaire réutilisé création/édition) : la
 * requête reste simplement désactivée tant qu'il n'y a pas d'id.
 */
export function useLivre(id: string | undefined) {
  return useQuery({
    queryKey: clesLivres.detail(id ?? ''),
    queryFn: async ({ signal }) => {
      const resultat = await obtenirLivre(id as string, signal);
      if (!resultat.succes) throw resultat.erreur;
      return resultat.donnees;
    },
    enabled: Boolean(id),
  });
}

/**
 * Scroll infini : le backend pagine déjà (page/limit/totalPages dans
 * schemaPageLivres) — ce hook accumule les pages successives au fur et à
 * mesure que l'écran demande la suivante, sans rien changer côté API.
 */
export function useLivresInfini(filtres: Omit<FiltresLivres, 'page'>) {
  return useInfiniteQuery({
    queryKey: clesLivres.liste(filtres),
    queryFn: async ({ pageParam, signal }) => {
      const resultat = await listerLivres({ ...filtres, page: pageParam }, signal);
      if (!resultat.succes) throw resultat.erreur;
      return resultat.donnees;
    },
    initialPageParam: 1,
    getNextPageParam: (dernierePage) =>
      dernierePage.page < dernierePage.totalPages ? dernierePage.page + 1 : undefined,
  });
}
