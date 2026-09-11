import { useQueryClient, useMutation } from '@tanstack/react-query';
import { creerLivre, remplacerLivre, supprimerLivre } from '@/services/api/livres';
import { clesLivres } from './useLivres';
import { useSuppressionEnAttente } from '@/features/books/suppressionEnAttente';
import type { Livre, SaisieLivre } from '@/domain/livre';
import type { ErreurApplicative } from '@/domain/erreurs';

/** Création d'un livre. Invalide la liste pour que la pagination redevienne cohérente. */
export function useCreerLivre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (saisie: SaisieLivre) => {
      const resultat = await creerLivre({ ...saisie, favori: false, note: null });
      if (!resultat.succes) throw resultat.erreur;
      return resultat.donnees;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clesLivres.tous });
    },
  });
}

/** Modification complète d'un livre existant (PUT + If-Match). */
export function useMettreAJourLivre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ livre, saisie }: { livre: Livre; saisie: SaisieLivre }) => {
      const resultat = await remplacerLivre({ ...livre, ...saisie });
      if (!resultat.succes) throw resultat.erreur;
      return resultat.donnees;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clesLivres.tous });
    },
  });
}

export const DELAI_ANNULATION_MS = 5000;
const minuteursEnAttente = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Suppression différée : le livre disparaît immédiatement de l'écran (retrait
 * optimiste du cache), mais l'appel réel à l'API n'a lieu qu'après 5 secondes
 * — le temps que `annulerSuppression` puisse être appelé pour tout annuler.
 * Sans ce délai, "annuler" nécessiterait de recréer le livre avec un nouvel
 * id, ce qui ne rattrape pas vraiment une suppression.
 */
export function useSupprimerLivreDifféré() {
  const queryClient = useQueryClient();

  const planifier = (livre: Livre): void => {
    queryClient.setQueriesData<{ items: Livre[]; total: number } | undefined>(
      { queryKey: clesLivres.tous },
      (page) => (page ? { ...page, items: page.items.filter((item) => item.id !== livre.id) } : page),
    );
    useSuppressionEnAttente.getState().annoncer(livre);

    const minuteur = setTimeout(() => {
      minuteursEnAttente.delete(livre.id);
      void supprimerLivre(livre.id).then((resultat) => {
        if (!resultat.succes) {
          // La suppression réelle a échoué côté serveur : on republie la liste à jour.
          void queryClient.invalidateQueries({ queryKey: clesLivres.tous });
        }
      });
    }, DELAI_ANNULATION_MS);

    minuteursEnAttente.set(livre.id, minuteur);
  };

  const annuler = (livreId: string): void => {
    const minuteur = minuteursEnAttente.get(livreId);
    if (minuteur) {
      clearTimeout(minuteur);
      minuteursEnAttente.delete(livreId);
    }
    useSuppressionEnAttente.getState().effacer();
    // Le livre n'a jamais été supprimé côté serveur : un simple refetch le refait apparaître.
    void queryClient.invalidateQueries({ queryKey: clesLivres.tous });
  };

  return { planifier, annuler };
}

export function estErreur422(erreur: unknown): erreur is Extract<ErreurApplicative, { type: 'validation' }> {
  return (
    typeof erreur === 'object' && erreur !== null && 'type' in erreur && (erreur as { type: unknown }).type === 'validation'
  );
}
