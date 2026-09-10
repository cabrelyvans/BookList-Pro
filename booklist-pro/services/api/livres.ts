import { z } from 'zod';
import { requete } from './client';
import { schemaLivre, schemaPageLivres, type FiltresLivres, type Livre } from '@/domain/livre';

function construireRequete(filtres: FiltresLivres): string {
  const parametres = new URLSearchParams();
  if (filtres.page) parametres.set('page', String(filtres.page));
  if (filtres.limit) parametres.set('limit', String(filtres.limit));
  if (filtres.q) parametres.set('q', filtres.q);
  if (filtres.status) parametres.set('status', filtres.status);
  if (filtres.favori !== undefined) parametres.set('favori', String(filtres.favori));
  if (filtres.sort) parametres.set('sort', filtres.sort);
  if (filtres.order) parametres.set('order', filtres.order);
  return `/books?${parametres.toString()}`;
}

export function listerLivres(filtres: FiltresLivres, signal?: AbortSignal) {
  return requete(construireRequete(filtres), schemaPageLivres, { signal });
}

export function obtenirLivre(id: string, signal?: AbortSignal) {
  return requete(`/books/${id}`, schemaLivre, { signal });
}

export function creerLivre(
  livre: Omit<Livre, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
) {
  return requete(`/books`, schemaLivre, { method: 'POST', corps: livre });
}

/** PUT — représentation complète, avec contrôle optimiste via If-Match. */
export function remplacerLivre(livre: Livre) {
  return requete(`/books/${livre.id}`, schemaLivre, {
    method: 'PUT',
    corps: livre,
    ifMatch: livre.version,
  });
}

/** PATCH — modification partielle (ex: bascule `lu` ou `favori`). */
export function modifierLivrePartiel(
  id: string,
  version: number,
  modifications: Partial<Pick<Livre, 'lu' | 'favori' | 'note' | 'titre' | 'auteur' | 'editeur' | 'annee'>>,
) {
  return requete(`/books/${id}`, schemaLivre, {
    method: 'PATCH',
    corps: modifications,
    ifMatch: version,
  });
}

export function supprimerLivre(id: string) {
  return requete(`/books/${id}`, z.undefined(), { method: 'DELETE' });
}
