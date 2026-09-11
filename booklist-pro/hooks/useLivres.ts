import { useInfiniteQuery, useQuery, type QueryClient, type InfiniteData } from '@tanstack/react-query';
import { listerLivres } from '@/services/api/livres';
import { versFiltresApi, type CritereRecherche } from '@/domain/recherche';
import type { FiltresLivres, Livre, PageLivres } from '@/domain/livre';

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

const TAILLE_PAGE = 20;

/**
 * Défilement infini (Lot 2) : chaque page est demandée au serveur avec les
 * critères actifs (recherche/filtres/tri) — jamais de filtrage côté client.
 * `fetchNextPage` déclenche un chargement dont l'état (`isFetchingNextPage`)
 * est distinct du chargement initial (`isLoading`), comme l'exige le sujet.
 */
export function useLivresInfini(criteres: CritereRecherche) {
  return useInfiniteQuery({
    queryKey: clesLivres.recherche(criteres),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const resultat = await listerLivres(versFiltresApi(criteres, pageParam, TAILLE_PAGE), signal);
      if (!resultat.succes) throw resultat.erreur;
      return resultat.donnees;
    },
    getNextPageParam: (dernierePage) => (dernierePage.page < dernierePage.totalPages ? dernierePage.page + 1 : undefined),
  });
}

/**
 * Utilitaire partagé : applique `transformer` à chaque item de chaque page
 * de chaque liste en cache (forme `InfiniteData<PageLivres>`). Centralise la
 * connaissance de cette forme — les mutations optimistes (favori, statut de
 * lecture, suppression) ne manipulent jamais directement `{ pages: [...] }`.
 */
export function transformerListesEnCache(
  queryClient: QueryClient,
  transformer: (items: Livre[]) => Livre[],
): [readonly unknown[], InfiniteData<PageLivres> | undefined][] {
  const precedent = queryClient.getQueriesData<InfiniteData<PageLivres>>({ queryKey: clesLivres.tous });

  queryClient.setQueriesData<InfiniteData<PageLivres> | undefined>({ queryKey: clesLivres.tous }, (donnees) =>
    donnees ? { ...donnees, pages: donnees.pages.map((page) => ({ ...page, items: transformer(page.items) })) } : donnees,
  );

  return precedent;
}
