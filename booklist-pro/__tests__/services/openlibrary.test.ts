import { rechercherOpenLibrary } from '@/services/api/openlibrary';

function mockReponse(statut: number, corps: unknown, ok = statut < 400): Response {
  return {
    ok,
    status: statut,
    json: async () => corps,
  } as unknown as Response;
}

describe('services/api/openlibrary — rechercherOpenLibrary', () => {
  const fetchOriginal = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    jest.resetAllMocks();
    jest.useRealTimers();
  });

  it('retourne les données validées par zod en cas de succès', async () => {
    const corps = { numFound: 1, docs: [{ edition_count: 400, first_publish_year: 1997 }] };
    globalThis.fetch = jest.fn().mockResolvedValue(mockReponse(200, corps)) as unknown as typeof fetch;

    const resultat = await rechercherOpenLibrary('Harry Potter', 'Rowling');

    expect(resultat).toEqual({ succes: true, donnees: corps });
  });

  it('traite "aucun résultat" comme un succès (numFound: 0, docs: []), pas une erreur', async () => {
    const corps = { numFound: 0, docs: [] };
    globalThis.fetch = jest.fn().mockResolvedValue(mockReponse(200, corps)) as unknown as typeof fetch;

    const resultat = await rechercherOpenLibrary('Ouvrage totalement inconnu', 'Personne');

    expect(resultat).toEqual({ succes: true, donnees: corps });
  });

  it('mappe une réponse HTTP en échec vers une ErreurReseau', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockReponse(500, {}, false)) as unknown as typeof fetch;

    const resultat = await rechercherOpenLibrary('Titre', 'Auteur');

    expect(resultat.succes).toBe(false);
    if (!resultat.succes) expect(resultat.erreur.type).toBe('reseau');
  });

  it('rejette une réponse qui ne correspond pas au schéma attendu', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockReponse(200, { pasLeBonChamp: true })) as unknown as typeof fetch;

    const resultat = await rechercherOpenLibrary('Titre', 'Auteur');

    expect(resultat.succes).toBe(false);
    if (!resultat.succes) expect(resultat.erreur.type).toBe('inconnue');
  });

  it('retourne une ErreurReseau "délai dépassé" si la requête n’aboutit pas avant le timeout', async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn().mockImplementation(
      (_input: unknown, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            const erreur = new Error('The operation was aborted');
            erreur.name = 'AbortError';
            reject(erreur);
          });
        }),
    ) as unknown as typeof fetch;

    const promesse = rechercherOpenLibrary('Titre', 'Auteur');
    jest.advanceTimersByTime(5000);
    const resultat = await promesse;

    expect(resultat).toEqual({ succes: false, erreur: { type: 'reseau', message: 'Délai OpenLibrary dépassé.' } });
  });
});
