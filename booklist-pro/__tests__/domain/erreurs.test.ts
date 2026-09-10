import { messageUtilisateur, estErreurApplicative } from '@/domain/erreurs';

describe('domain/erreurs', () => {
  it('reconnaît une erreur applicative bien formée', () => {
    const erreur = { type: 'reseau' as const, message: 'x' };
    expect(estErreurApplicative(erreur)).toBe(true);
    expect(estErreurApplicative({})).toBe(false);
    expect(estErreurApplicative(null)).toBe(false);
  });

  it('fournit un message compréhensible par erreur, sans jargon technique', () => {
    expect(messageUtilisateur({ type: 'reseau', message: 'x' })).toMatch(/serveur/i);
    expect(
      messageUtilisateur({ type: 'conflit', message: 'x', versionAttendue: 3, serveur: {} }),
    ).toMatch(/modifiée/i);
    expect(
      messageUtilisateur({ type: 'auth', code: 'droits_insuffisants', message: 'x' }),
    ).toMatch(/droits/i);
  });
});
