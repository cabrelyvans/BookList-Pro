import { fireEvent } from '@testing-library/react-native';
import { EtatEcran } from '@/components/EtatEcran';
import { rendreAvecTheme } from '../aidesTest';

describe('components/EtatEcran', () => {
  it('affiche un indicateur de chargement', () => {
    const { getByLabelText } = rendreAvecTheme(<EtatEcran statut="chargement" />);
    expect(getByLabelText('Chargement en cours')).toBeTruthy();
  });

  it('affiche le message d’erreur et déclenche onReessayer au clic', () => {
    const onReessayer = jest.fn();
    const { getByRole } = rendreAvecTheme(
      <EtatEcran statut="erreur" erreur={{ type: 'reseau', message: 'x' }} onReessayer={onReessayer} />,
    );
    fireEvent.press(getByRole('button', { name: 'Réessayer' }));
    expect(onReessayer).toHaveBeenCalledTimes(1);
  });

  it('affiche le message contextualisé en état vide', () => {
    const { getByText } = rendreAvecTheme(<EtatEcran statut="vide" message="Rien à afficher." />);
    expect(getByText('Rien à afficher.')).toBeTruthy();
  });

  it('ne plante pas en état succès avec un fragment vide', () => {
    expect(() =>
      rendreAvecTheme(
        <EtatEcran statut="succes">
          <></>
        </EtatEcran>,
      ),
    ).not.toThrow();
  });
});
