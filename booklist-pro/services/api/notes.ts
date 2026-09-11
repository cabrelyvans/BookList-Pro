// Endpoints typés : lister/ajouter/supprimer une note de lecture.
import { z } from 'zod';
import { requete } from './client';
import { schemaNote } from '@/domain/note';

export function listerNotes(livreId: string, signal?: AbortSignal) {
  return requete(`/books/${livreId}/notes`, z.array(schemaNote), { signal });
}

export function ajouterNote(livreId: string, contenu: string) {
  return requete(`/books/${livreId}/notes`, schemaNote, {
    method: 'POST',
    corps: { contenu },
  });
}

export function supprimerNote(livreId: string, noteId: string) {
  return requete(`/books/${livreId}/notes/${noteId}`, z.undefined(), { method: 'DELETE' });
}
