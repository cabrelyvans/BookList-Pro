import { useInfiniteQuery, useQuery, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { listerLivres, obtenirLivre } from '@/services/api/livres';
import type { FiltresLivres, Livre, PageLivres } from '@/domain/livre';
import { versFiltresApi, type CritereRecherche } from '@/domain/recherche';

/** Clé de cache structurée — voir ADR 001. */
export const clesLivres = {
  tous: ['livres'] as const,
  liste: (filtres: FiltresLivres) => [...clesLivres.tous, 'liste', filtres] as const,
  recherche: (criteres: CritereRecherche) => [...clesLivres.tous, 'recherche', criteres] as const,
  detail: (id: string) => [...clesLivres.tous, 'detail', id] as const,
};

/** Cache d'une page simple (useLivres) ou empilée par useInfiniteQuery (useLivresInfini). */
export type CacheListe = PageLivres | InfiniteData<PageLivres>;

/**
 * Applique `transform` à chaque cache de type liste (clé `['livres','liste',…]`,
 * matché par préfixe — donc toutes les variantes filtrées à la fois) —
 * jamais la fiche détail (`['livres','detail',id]`), un simple objet Livre
 * sans tableau `items` : la toucher ici faisait planter l'app (confirmé en
 * réel). Retourne un instantané de chaque entrée touchée, dans le format
 * `[queryKey, ancienneDonnee]` dont une mise à jour optimiste a besoin pour
 * annuler en cas d'échec (voir useFavoris.ts, onError) — capturé *avant*
 * l'écriture, setQueriesData lui-même ne renvoie que les nouvelles données.
 */
export function transformerListesEnCache(
  queryClient: QueryClient,
  transform: (items: Livre[]) => Livre[],
): [readonly unknown[], CacheListe | undefined][] {
  const filtre = { queryKey: [...clesLivres.tous, 'liste'] };
  const precedent = queryClient.getQueriesData<CacheListe>(filtre);

  const appliquer = (page: PageLivres): PageLivres => ({ ...page, items: transform(page.items) });
  queryClient.setQueriesData<CacheListe>(filtre, (cache) => {
    if (!cache) return cache;
    return 'pages' in cache ? { ...cache, pages: cache.pages.map(appliquer) } : appliquer(cache);
  });

  return precedent;
}

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
 *
 * Prend les critères UI (CritereRecherche — q/statut/favorisSeulement/tri/
 * ordre) directement, pas déjà traduits en FiltresLivres : versFiltresApi
 * (domain/recherche.ts) fait cette traduction ici, à chaque page demandée,
 * un seul endroit qui connaît le mapping vers la forme attendue par
 * GET /books (q/status/favori/sort/order). La clé de cache exclut `page`
 * volontairement — toutes les pages d'une même recherche doivent partager
 * une seule entrée de cache (empilées par pages[]), pas une par page.
 */
export function useLivresInfini(criteres: CritereRecherche) {
  const { page: _page, ...filtresSansPage } = versFiltresApi(criteres, 1);

  return useInfiniteQuery({
    queryKey: clesLivres.liste(filtresSansPage),
    queryFn: async ({ pageParam, signal }) => {
      const resultat = await listerLivres(versFiltresApi(criteres, pageParam), signal);
      if (!resultat.succes) throw resultat.erreur;
      return resultat.donnees;
    },
    initialPageParam: 1,
    getNextPageParam: (dernierePage) =>
      dernierePage.page < dernierePage.totalPages ? dernierePage.page + 1 : undefined,
  });
}
