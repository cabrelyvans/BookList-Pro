import { versParametresApi, criteresActifs, CRITERES_PAR_DEFAUT } from '@/domain/recherche';

describe('domain/recherche', () => {
  it('ne sérialise que les critères par défaut nécessaires (page, limit, tri)', () => {
    const parametres = versParametresApi(CRITERES_PAR_DEFAUT, 1);
    expect(parametres).toEqual({ page: '1', limit: '20', sort: 'titre', order: 'asc' });
    expect(parametres.q).toBeUndefined();
    expect(parametres.status).toBeUndefined();
    expect(parametres.favori).toBeUndefined();
  });

  it('ajoute q, status et favori uniquement quand ils sont actifs', () => {
    const parametres = versParametresApi(
      { q: '  tolkien  ', statut: 'lu', favorisSeulement: true, tri: 'annee', ordre: 'desc' },
      2,
      10,
    );
    expect(parametres).toEqual({
      page: '2',
      limit: '10',
      sort: 'annee',
      order: 'desc',
      q: 'tolkien',
      status: 'lu',
      favori: 'true',
    });
  });

  it('détecte si des critères de filtrage sont actifs', () => {
    expect(criteresActifs(CRITERES_PAR_DEFAUT)).toBe(false);
    expect(criteresActifs({ ...CRITERES_PAR_DEFAUT, q: 'x' })).toBe(true);
    expect(criteresActifs({ ...CRITERES_PAR_DEFAUT, favorisSeulement: true })).toBe(true);
  });
});
