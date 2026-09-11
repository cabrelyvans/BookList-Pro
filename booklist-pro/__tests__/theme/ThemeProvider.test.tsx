import { Text, Pressable } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest')); // eslint-disable-line @typescript-eslint/no-require-imports -- jest.mock() factory doit rester synchrone, pas d'import ESM possible ici

/** Expose juste ce dont les tests ont besoin, via le hook public useTheme(). */
function Consommateur() {
  const { preference, basculerTheme } = useTheme();
  return (
    <>
      <Text>{preference}</Text>
      <Pressable onPress={basculerTheme} accessibilityRole="button" accessibilityLabel="Basculer">
        <Text>Basculer</Text>
      </Pressable>
    </>
  );
}

describe('theme/ThemeProvider', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('démarre sur "clair" quand rien n’est persisté (préférence système simulée claire par défaut)', async () => {
    render(
      <ThemeProvider>
        <Consommateur />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByText('clair')).toBeTruthy());
  });

  it('bascule clair -> sombre -> clair au clic, et persiste chaque choix', async () => {
    render(
      <ThemeProvider>
        <Consommateur />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByText('clair')).toBeTruthy());

    fireEvent.press(screen.getByRole('button', { name: 'Basculer' }));
    await waitFor(() => expect(screen.getByText('sombre')).toBeTruthy());
    await waitFor(async () => expect(await AsyncStorage.getItem('preferences:theme')).toBe('sombre'));

    fireEvent.press(screen.getByRole('button', { name: 'Basculer' }));
    await waitFor(() => expect(screen.getByText('clair')).toBeTruthy());
    await waitFor(async () => expect(await AsyncStorage.getItem('preferences:theme')).toBe('clair'));
  });

  it('relit la préférence déjà persistée au montage et l’applique par-dessus le choix système', async () => {
    await AsyncStorage.setItem('preferences:theme', 'sombre');

    render(
      <ThemeProvider>
        <Consommateur />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('sombre')).toBeTruthy());
  });

  it('garde la préférence système par défaut si AsyncStorage échoue à la lecture (filet de sécurité)', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('stockage indisponible'));

    render(
      <ThemeProvider>
        <Consommateur />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('clair')).toBeTruthy());
  });
});
