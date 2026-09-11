import { render, fireEvent } from '@testing-library/react-native';
import { EtatEcran } from '@/components/EtatEcran';

describe('components/EtatEcran', () => {
  it('affiche un indicateur de chargement', () => {
    const { getByLabelText } = render(<EtatEcran statut="chargement" />);
    expect(getByLabelText('Chargement en cours')).toBeTruthy();
  });

  it('affiche le message d\u2019erreur et déclenche onReessayer au clic', () => {
    const onReessayer = jest.fn();
    const { getByRole } = render(
      <EtatEcran statut="erreur" erreur={{ type: 'reseau', message: 'x' }} onReessayer={onReessayer} />,
    );
    fireEvent.press(getByRole('button', { name: 'Réessayer' }));
    expect(onReessayer).toHaveBeenCalledTimes(1);
  });

  it('affiche le message contextualisé en état vide', () => {
    const { getByText } = render(<EtatEcran statut="vide" message="Rien à afficher." />);
    expect(getByText('Rien à afficher.')).toBeTruthy();
  });

  it('ne plante pas en état succès avec un fragment vide', () => {
    expect(() =>
      render(
        <EtatEcran statut="succes">
          <></>
        </EtatEcran>,
      ),
    ).not.toThrow();
  });
});
