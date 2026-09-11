import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useLivresInfini } from '@/hooks/useLivres';
import { CRITERES_PAR_DEFAUT } from '@/domain/recherche';

const PAGE_1 = {
  items: [
    { id: '1', titre: 'Livre Un', auteur: 'A', editeur: 'E', annee: 2020, lu: false, favori: false, note: null, couverture: null, createdAt: 'x', updatedAt: 'x', version: 1 },
  ],
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
};

function creerWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('hooks/useLivresInfini (API simulée via mock de fetch)', () => {
  const fetchOriginal = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    jest.resetAllMocks();
  });

  it('charge la première page et valide la réponse avec zod', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => PAGE_1,
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useLivresInfini(CRITERES_PAR_DEFAUT), { wrapper: creerWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.pages[0]?.items).toHaveLength(1);
    expect(result.current.data?.pages[0]?.items[0]?.titre).toBe('Livre Un');
    expect(result.current.hasNextPage).toBe(false);
  });

  it('expose une erreur applicative de type "reseau" quand le serveur est injoignable', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    const { result } = renderHook(() => useLivresInfini(CRITERES_PAR_DEFAUT), { wrapper: creerWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toMatchObject({ type: 'reseau' });
  });
});
