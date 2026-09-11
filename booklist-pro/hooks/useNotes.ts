import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ajouterNote, listerNotes, supprimerNote } from '@/services/api/notes';

export const clesNotes = {
  du: (livreId: string) => ['notes', livreId] as const,
};

export function useNotes(livreId: string) {
  return useQuery({
    queryKey: clesNotes.du(livreId),
    queryFn: async ({ signal }) => {
      const resultat = await listerNotes(livreId, signal);
      if (!resultat.succes) throw resultat.erreur;
      return resultat.donnees;
    },
  });
}

export function useAjouterNote(livreId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contenu: string) => {
      const resultat = await ajouterNote(livreId, contenu);
      if (!resultat.succes) throw resultat.erreur;
      return resultat.donnees;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clesNotes.du(livreId) });
    },
  });
}

export function useSupprimerNote(livreId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) => {
      const resultat = await supprimerNote(livreId, noteId);
      if (!resultat.succes) throw resultat.erreur;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clesNotes.du(livreId) });
    },
  });
}
