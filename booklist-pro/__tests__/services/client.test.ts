import { z } from 'zod';
import { requete } from '@/services/api/client';

const schema = z.object({ id: z.string() });

function mockReponse(statut: number, corps: unknown, ok = statut < 400): Response {
  return {
    ok,
    status: statut,
    json: async () => corps,
  } as unknown as Response;
}

describe('services/api/client — requete', () => {
  const fetchOriginal = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    jest.resetAllMocks();
  });

  it('retourne les données validées par zod en cas de succès', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockReponse(200, { id: 'abc' })) as unknown as typeof fetch;
    const resultat = await requete('/x', schema);
    expect(resultat).toEqual({ succes: true, donnees: { id: 'abc' } });
  });

  it('mappe un 401 avec code jeton_expire vers une ErreurAuth', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(mockReponse(401, { erreur: 'jeton_expire', message: 'Jeton expiré' }, false)) as unknown as typeof fetch;
    const resultat = await requete('/x', schema);
    expect(resultat).toEqual({ succes: false, erreur: { type: 'auth', code: 'jeton_expire', message: 'Jeton expiré' } });
  });

  it('mappe un 403 vers droits_insuffisants', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockReponse(403, { message: 'Interdit' }, false)) as unknown as typeof fetch;
    const resultat = await requete('/x', schema);
    expect(resultat).toEqual({ succes: false, erreur: { type: 'auth', code: 'droits_insuffisants', message: 'Interdit' } });
  });

  it('mappe un 409 vers une ErreurConflit avec la version et la ressource serveur', async () => {
    const corpsServeur = { titre: 'Version serveur' };
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(mockReponse(409, { message: 'Conflit', versionAttendue: 3, serveur: corpsServeur }, false)) as unknown as typeof fetch;
    const resultat = await requete('/x', schema);
    expect(resultat).toEqual({
      succes: false,
      erreur: { type: 'conflit', message: 'Conflit', versionAttendue: 3, serveur: corpsServeur },
    });
  });

  it('mappe un 422 vers une ErreurValidation avec les champs fautifs', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(mockReponse(422, { message: 'Validation échouée', champs: { titre: 'obligatoire' } }, false)) as unknown as typeof fetch;
    const resultat = await requete('/x', schema);
    expect(resultat).toEqual({
      succes: false,
      erreur: { type: 'validation', message: 'Validation échouée', champs: { titre: 'obligatoire' } },
    });
  });

  it('mappe un 503 vers une ErreurReseau (mode dégradé de l\u2019API)', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockReponse(503, {}, false)) as unknown as typeof fetch;
    const resultat = await requete('/x', schema);
    expect(resultat).toEqual({ succes: false, erreur: { type: 'reseau', message: 'Service momentanément indisponible, réessayez.' } });
  });

  it('retombe sur une ErreurInconnue pour un statut non mappé explicitement', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockReponse(418, { message: "Je suis une théière" }, false)) as unknown as typeof fetch;
    const resultat = await requete('/x', schema);
    expect(resultat).toEqual({ succes: false, erreur: { type: 'inconnue', message: "Je suis une théière" } });
  });

  it('retourne une ErreurReseau si fetch rejette (serveur injoignable)', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('down')) as unknown as typeof fetch;
    const resultat = await requete('/x', schema);
    expect(resultat.succes).toBe(false);
    if (!resultat.succes) expect(resultat.erreur.type).toBe('reseau');
  });

  it('rejette une réponse qui ne correspond pas au schéma attendu', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockReponse(200, { pasLeBonChamp: true })) as unknown as typeof fetch;
    const resultat = await requete('/x', schema);
    expect(resultat.succes).toBe(false);
    if (!resultat.succes) expect(resultat.erreur.type).toBe('inconnue');
  });
});
