import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { CarteLivre } from '@/components/CarteLivre';
import type { Livre } from '@/domain/livre';
import { rendreAvecTheme } from '../aidesTest';

// Mesure du gain réel de React.memo() sur CarteLivre — pas un nombre inventé.
// <Couverture> est rendu sans condition à chaque exécution du corps de
// CarteLivreBrute : la remplacer par un espion permet de compter les
// exécutions réelles du composant, contrairement au Profiler natif de React
// dont onRender se déclenche même quand un enfant mémoïsé n'a pas re-rendu
// (vérifié empiriquement avant d'écrire ce test — voir docs/PERFORMANCE.md).
const mockRendusCouverture = jest.fn();
jest.mock('@/components/Couverture', () => ({
  Couverture: (props: { idLivre: string }) => {
    mockRendusCouverture(props.idLivre);
    return null;
  },
}));

function livre(id: string): Livre {
  return {
    id,
    titre: `Livre ${id}`,
    auteur: 'Auteur',
    editeur: 'Éditeur',
    annee: 2020,
    lu: false,
    favori: false,
    note: null,
    couverture: null,
    createdAt: 'x',
    updatedAt: 'x',
    version: 1,
  };
}

const LIVRES = Array.from({ length: 20 }, (_, i) => livre(String(i)));

/**
 * `instable` reproduit le bug réel trouvé dans app/index.tsx avant correctif :
 * `onPress={(id) => router.push(...)}` inline recréait une fonction à chaque
 * rendu de l'écran, ce qui invalidait React.memo sur CarteLivre malgré lui.
 * `instable=false` reproduit le correctif (onPress mémoïsé via useCallback).
 */
function Banc({ instable }: { instable: boolean }) {
  const [, setTick] = useState(0);
  const onPressStable = useCallback((id: string) => {
    void id;
  }, []);

  return (
    <View>
      <Pressable testID="forcer-rerendu" onPress={() => setTick((t) => t + 1)} />
      {LIVRES.map((item) => (
        <CarteLivre key={item.id} livre={item} onPress={instable ? (id: string) => void id : onPressStable} />
      ))}
    </View>
  );
}

describe('components/CarteLivre — effet réel de React.memo selon la stabilité de onPress', () => {
  beforeEach(() => mockRendusCouverture.mockClear());

  it('sans référence stable (bug), chaque ligne re-rend même si aucun livre n’a changé', () => {
    const { getByTestId } = rendreAvecTheme(<Banc instable />);
    mockRendusCouverture.mockClear(); // on ignore le montage initial

    fireEvent.press(getByTestId('forcer-rerendu'));

    expect(mockRendusCouverture).toHaveBeenCalledTimes(LIVRES.length);
  });

  it('avec une référence onPress stable (useCallback, le correctif appliqué), React.memo évite tous les re-rendus inutiles', () => {
    const { getByTestId } = rendreAvecTheme(<Banc instable={false} />);
    mockRendusCouverture.mockClear();

    fireEvent.press(getByTestId('forcer-rerendu'));

    expect(mockRendusCouverture).toHaveBeenCalledTimes(0);
  });
});
