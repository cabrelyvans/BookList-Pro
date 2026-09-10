import type { z } from 'zod';
import { DELAI_EXPIRATION_MS, URL_BASE_API } from './config';
import type { ErreurApplicative } from '@/domain/erreurs';

type CorpsErreurApi = {
  erreur?: string;
  message?: string;
  champs?: Record<string, string>;
  serveur?: unknown;
  versionAttendue?: number;
};

type OptionsRequete = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  corps?: unknown;
  /** Valeur de version pour le contrôle optimiste (en-tête If-Match) */
  ifMatch?: number;
  jetonAcces?: string;
  signal?: AbortSignal;
};

/** Résultat explicite plutôt qu'une exception — force l'appelant à traiter l'échec. */
export type ResultatApi<T> = { succes: true; donnees: T } | { succes: false; erreur: ErreurApplicative };

async function erreurDepuisReponse(reponse: Response): Promise<ErreurApplicative> {
  let corps: CorpsErreurApi = {};
  try {
    corps = (await reponse.json()) as CorpsErreurApi;
  } catch {
    // corps non-JSON (ex: 503 brut) — on retombe sur le statut HTTP seul
  }

  switch (reponse.status) {
    case 401:
      return {
        type: 'auth',
        code:
          corps.erreur === 'jeton_expire'
            ? 'jeton_expire'
            : corps.erreur === 'jeton_invalide'
              ? 'jeton_invalide'
              : 'jeton_absent',
        message: corps.message ?? 'Authentification requise.',
      };
    case 403:
      return { type: 'auth', code: 'droits_insuffisants', message: corps.message ?? 'Droits insuffisants.' };
    case 409:
      return {
        type: 'conflit',
        message: corps.message ?? 'Conflit de version.',
        versionAttendue: corps.versionAttendue ?? 0,
        serveur: corps.serveur,
      };
    case 422:
      return {
        type: 'validation',
        message: corps.message ?? 'Validation échouée.',
        champs: corps.champs ?? {},
      };
    case 503:
      return { type: 'reseau', message: 'Service momentanément indisponible, réessayez.' };
    default:
      return { type: 'inconnue', message: corps.message ?? `Erreur HTTP ${reponse.status}` };
  }
}

/**
 * Client HTTP unique — chapitre 3.2 : seul services/ connaît l'URL de base,
 * les en-têtes, les délais d'expiration et le traitement des erreurs.
 * Ne JAMAIS appeler fetch() directement ailleurs dans le code.
 */
export async function requete<T>(
  chemin: string,
  schema: z.ZodType<T>,
  options: OptionsRequete = {},
): Promise<ResultatApi<T>> {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), DELAI_EXPIRATION_MS);

  // Combine le signal externe (démontage de composant) et le timeout interne
  if (options.signal) {
    options.signal.addEventListener('abort', () => controleur.abort());
  }

  const entetes: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.ifMatch !== undefined) entetes['If-Match'] = String(options.ifMatch);
  if (options.jetonAcces) entetes.Authorization = `Bearer ${options.jetonAcces}`;

  try {
    const reponse = await fetch(`${URL_BASE_API}${chemin}`, {
      method: options.method ?? 'GET',
      headers: entetes,
      body: options.corps !== undefined ? JSON.stringify(options.corps) : undefined,
      signal: controleur.signal,
    });

    if (!reponse.ok) {
      return { succes: false, erreur: await erreurDepuisReponse(reponse) };
    }

    if (reponse.status === 204) {
      return { succes: true, donnees: undefined as T };
    }

    const json: unknown = await reponse.json();
    const analyse = schema.safeParse(json);
    if (!analyse.success) {
      return {
        succes: false,
        erreur: {
          type: 'inconnue',
          message: 'La réponse du serveur ne correspond pas au format attendu.',
          cause: analyse.error,
        },
      };
    }
    return { succes: true, donnees: analyse.data };
  } catch (cause) {
    if (controleur.signal.aborted) {
      return { succes: false, erreur: { type: 'reseau', message: 'Délai dépassé, réessayez.' } };
    }
    return { succes: false, erreur: { type: 'reseau', message: 'Impossible de joindre le serveur.', cause } };
  } finally {
    clearTimeout(minuteur);
  }
}
