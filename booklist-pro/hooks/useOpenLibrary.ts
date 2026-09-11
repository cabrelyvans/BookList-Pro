// TanStack Query : enrichissement OpenLibrary (nombre d'éditions, année de première publication).
import { useQuery } from '@tanstack/react-query';
import { rechercherOpenLibrary } from '@/services/api/openlibrary';
import { versEnrichissement, type EnrichissementOpenLibrary } from '@/domain/openlibrary';

/**
 * Enrichissement OpenLibrary pour la fiche d'un livre (Lot 3).
 *
 * Dégradation silencieuse : OpenLibrary est un service tiers, non essentiel
 * à la fiche livre (dont les données viennent de l'API locale). En cas
 * d'échec ou de timeout, `isError` reste vrai côté TanStack Query mais
 * l'écran ne doit jamais bloquer dessus — il masque simplement la section
 * d'enrichissement plutôt que d'afficher un état d'erreur.
 *
 * Mise en cache longue (24h) : ces métadonnées ne changent pour ainsi dire
 * jamais d'une session à l'autre, inutile de re-questionner OpenLibrary à
 * chaque ouverture de la fiche.
 */
export function useOpenLibrary(titre: string, auteur: string) {
  return useQuery<EnrichissementOpenLibrary>({
    queryKey: ['openlibrary', titre, auteur],
    queryFn: async ({ signal }) => {
      const resultat = await rechercherOpenLibrary(titre, auteur, signal);
      if (!resultat.succes) throw resultat.erreur;
      return versEnrichissement(resultat.donnees);
    },
    enabled: titre.trim().length > 0 && auteur.trim().length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
