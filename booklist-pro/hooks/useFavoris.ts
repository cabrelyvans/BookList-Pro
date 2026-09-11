import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modifierLivrePartiel } from '@/services/api/livres';
import { clesLivres, transformerListesEnCache, type CacheListe } from './useLivres';
import type { Livre } from '@/domain/livre';

type ContextePrecedent = { precedent: [readonly unknown[], CacheListe | undefined][] };

function creerBasculeOptimiste(champ: 'favori' | 'lu') {
  return () => {
    const queryClient = useQueryClient();

    return useMutation<Livre, unknown, Livre, ContextePrecedent>({
      mutationFn: async (livre) => {
        const resultat = await modifierLivrePartiel(livre.id, livre.version, { [champ]: !livre[champ] });
        if (!resultat.succes) throw resultat.erreur;
        return resultat.donnees;
      },
      onMutate: async (livre) => {
        await queryClient.cancelQueries({ queryKey: clesLivres.tous });
        const precedent = transformerListesEnCache(queryClient, (items) =>
          items.map((item) => (item.id === livre.id ? { ...item, [champ]: !item[champ] } : item)),
        );
        return { precedent };
      },
      onError: (_erreur, _livre, contexte) => {
        // Le serveur a refusé : on republie exactement l'état d'avant la mutation.
        contexte?.precedent.forEach(([cle, donnees]) => queryClient.setQueryData(cle, donnees));
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: clesLivres.tous });
      },
    });
  };
}

/**
 * Bascule du favori avec mise à jour optimiste (Lot 2) : l'icône réagit
 * immédiatement, et revient en arrière automatiquement si le serveur
 * refuse la mutation (à démontrer en `npm run chaos`).
 */
export const useBasculerFavori = creerBasculeOptimiste('favori');

/** Même principe pour le statut de lecture — exigé explicitement par le sujet. */
export const useBasculerLu = creerBasculeOptimiste('lu');
