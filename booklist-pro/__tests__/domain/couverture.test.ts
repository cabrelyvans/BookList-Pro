import { resoudreCouverture, teinteRepli, initialesRepli } from '@/domain/couverture';

describe('domain/couverture — resoudreCouverture', () => {
  const urlBase = 'http://localhost:3000';
  const id = 'abc-123';

  it('retombe sur un repli local quand le champ est vide ou null', () => {
    expect(resoudreCouverture(null, id, urlBase)).toEqual({ type: 'repli', graine: id });
  });

  it('laisse une URL externe absolue intacte', () => {
    const url = 'https://cdn.example.com/couverture.jpg';
    expect(resoudreCouverture(url, id, urlBase)).toEqual({ type: 'distante', url });
  });

  it('préfixe un chemin relatif envoyé par un libraire (/media/...)', () => {
    expect(resoudreCouverture('/media/abc-123.png', id, urlBase)).toEqual({
      type: 'distante',
      url: 'http://localhost:3000/media/abc-123.png',
    });
  });

  it('ne construit jamais une URL vers /covers/:id.svg (route inexistante sur l’API fournie)', () => {
    const resultat = resoudreCouverture(null, id, urlBase);
    expect(JSON.stringify(resultat)).not.toContain('/covers/');
  });
});

describe('domain/couverture — teinteRepli', () => {
  it('est déterministe pour une même graine', () => {
    expect(teinteRepli('abc-123')).toBe(teinteRepli('abc-123'));
  });

  it('reste dans la plage 0-359', () => {
    const teinte = teinteRepli('un-identifiant-quelconque');
    expect(teinte).toBeGreaterThanOrEqual(0);
    expect(teinte).toBeLessThan(360);
  });
});

describe('domain/couverture — initialesRepli', () => {
  it('prend les deux premières initiales des mots du titre', () => {
    expect(initialesRepli('Des Terres lointaines')).toBe('DT');
  });

  it('retombe sur "?" si le titre ne contient aucune lettre exploitable', () => {
    expect(initialesRepli('')).toBe('?');
    expect(initialesRepli('   ')).toBe('?');
  });
});
