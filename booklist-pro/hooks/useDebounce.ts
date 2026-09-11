import { useEffect, useState } from 'react';

/** Anti-rebond générique (300ms par défaut) — Lot 2 : recherche serveur. */
export function useDebounce<T>(valeur: T, delaiMs = 300): T {
  const [valeurDifferee, setValeurDifferee] = useState(valeur);

  useEffect(() => {
    const minuteur = setTimeout(() => setValeurDifferee(valeur), delaiMs);
    return () => clearTimeout(minuteur);
  }, [valeur, delaiMs]);

  return valeurDifferee;
}
