// Appel externe openlibrary.org/search.json — isolé ici, jamais appelé depuis un composant.
import { schemaReponseOpenLibrary, type ReponseOpenLibrary } from '@/domain/openlibrary';
import type { ResultatApi } from './client';

// Service externe distinct de l'API locale (autre domaine, autre délai
// d'expiration) : on ne réutilise pas requete()/URL_BASE_API de client.ts,
// mais on retourne le même type ResultatApi<T> / ErreurApplicative pour que
// les hooks appelants traitent l'échec de façon uniforme.
const URL_BASE_OPENLIBRARY = 'https://openlibrary.org';
const DELAI_EXPIRATION_OPENLIBRARY_MS = 5000;

/**
 * Recherche OpenLibrary par titre + auteur, pour enrichir une fiche livre
 * (nombre d'éditions, année de première publication). Délai d'expiration
 * court : un service externe indisponible ne doit jamais faire attendre
 * longtemps un écran qui, par ailleurs, a déjà ses données essentielles.
 */
export async function rechercherOpenLibrary(
  titre: string,
  auteur: string,
  signal?: AbortSignal,
): Promise<ResultatApi<ReponseOpenLibrary>> {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), DELAI_EXPIRATION_OPENLIBRARY_MS);
  if (signal) {
    signal.addEventListener('abort', () => controleur.abort());
  }

  const parametres = new URLSearchParams({
    title: titre,
    author: auteur,
    limit: '1',
    fields: 'edition_count,first_publish_year',
  });

  try {
    const reponse = await fetch(`${URL_BASE_OPENLIBRARY}/search.json?${parametres.toString()}`, {
      signal: controleur.signal,
    });

    if (!reponse.ok) {
      return { succes: false, erreur: { type: 'reseau', message: `OpenLibrary indisponible (HTTP ${reponse.status}).` } };
    }

    const json: unknown = await reponse.json();
    const analyse = schemaReponseOpenLibrary.safeParse(json);
    if (!analyse.success) {
      return {
        succes: false,
        erreur: { type: 'inconnue', message: 'Réponse OpenLibrary inattendue.', cause: analyse.error },
      };
    }
    return { succes: true, donnees: analyse.data };
  } catch (cause) {
    if (controleur.signal.aborted) {
      return { succes: false, erreur: { type: 'reseau', message: 'Délai OpenLibrary dépassé.' } };
    }
    return { succes: false, erreur: { type: 'reseau', message: 'Impossible de joindre OpenLibrary.', cause } };
  } finally {
    clearTimeout(minuteur);
  }
}
