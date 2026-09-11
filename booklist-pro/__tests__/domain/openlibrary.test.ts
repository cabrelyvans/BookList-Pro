import { versEnrichissement } from '@/domain/openlibrary';

describe('domain/openlibrary — versEnrichissement', () => {
  it('réduit une réponse avec un document trouvé', () => {
    expect(versEnrichissement({ numFound: 1, docs: [{ edition_count: 400, first_publish_year: 1997 }] })).toEqual({
      trouve: true,
      nombreEditions: 400,
      anneePremierePublication: 1997,
    });
  });

  it('traite "aucun document" comme un résultat normal, pas une erreur', () => {
    expect(versEnrichissement({ numFound: 0, docs: [] })).toEqual({ trouve: false });
  });

  it('retombe sur 0 édition et une année nulle quand ces champs sont absents du document', () => {
    expect(versEnrichissement({ numFound: 1, docs: [{}] })).toEqual({
      trouve: true,
      nombreEditions: 0,
      anneePremierePublication: null,
    });
  });
});
