import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useOpenLibrary } from '@/hooks/useOpenLibrary';

function mockReponse(corps: unknown): Response {
  return { ok: true, status: 200, json: async () => corps } as unknown as Response;
}

function creerWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('hooks/useOpenLibrary', () => {
  const fetchOriginal = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    jest.resetAllMocks();
  });

  it('expose le nombre d’éditions et l’année de première publication en cas de résultat trouvé', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(mockReponse({ numFound: 1, docs: [{ edition_count: 400, first_publish_year: 1997 }] })) as unknown as typeof fetch;

    const { result } = renderHook(() => useOpenLibrary('Harry Potter', 'Rowling'), { wrapper: creerWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ trouve: true, nombreEditions: 400, anneePremierePublication: 1997 });
  });

  it('traite "aucune édition trouvée" comme un succès (isError=false), pas une erreur', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockReponse({ numFound: 0, docs: [] })) as unknown as typeof fetch;

    const { result } = renderHook(() => useOpenLibrary('Ouvrage totalement inconnu', 'Personne'), { wrapper: creerWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual({ trouve: false });
  });

  it('ne déclenche aucune requête tant que le titre ou l’auteur sont vides', () => {
    globalThis.fetch = jest.fn() as unknown as typeof fetch;

    const { result } = renderHook(() => useOpenLibrary('', ''), { wrapper: creerWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
