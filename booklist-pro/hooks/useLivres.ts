import { useQuery } from '@tanstack/react-query';
import { listerLivres } from '@/services/api/livres';
import type { FiltresLivres } from '@/domain/livre';

/** Clé de cache structurée — chapitre §Lot 1 : clés de cache + invalidation après mutation. */
export const clesLivres = {
  tous: ['livres'] as const,
  liste: (filtres: FiltresLivres) => [...clesLivres.tous, 'liste', filtres] as const,
  detail: (id: string) => [...clesLivres.tous, 'detail', id] as const,
};

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
