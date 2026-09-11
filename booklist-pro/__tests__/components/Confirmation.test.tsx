import { render, screen, fireEvent } from '@testing-library/react-native';
import { Confirmation } from '@/components/Confirmation';

describe('components/Confirmation', () => {
  const props = {
    titre: 'Supprimer ?',
    message: 'Cette action est définitive.',
    libelleConfirmer: 'Supprimer',
    libelleAnnuler: 'Annuler',
  };

  it('n\u2019affiche rien tant que visible est faux', () => {
    render(<Confirmation {...props} visible={false} onConfirmer={jest.fn()} onAnnuler={jest.fn()} />);
    expect(screen.queryByText('Supprimer ?')).toBeNull();
  });

  it('appelle onConfirmer au clic sur le bouton de confirmation', () => {
    const onConfirmer = jest.fn();
    render(<Confirmation {...props} visible onConfirmer={onConfirmer} onAnnuler={jest.fn()} />);
    fireEvent.press(screen.getByRole('button', { name: 'Supprimer' }));
    expect(onConfirmer).toHaveBeenCalledTimes(1);
  });

  it('appelle onAnnuler au clic sur le bouton d\u2019annulation', () => {
    const onAnnuler = jest.fn();
    render(<Confirmation {...props} visible onConfirmer={jest.fn()} onAnnuler={onAnnuler} />);
    fireEvent.press(screen.getByRole('button', { name: 'Annuler' }));
    expect(onAnnuler).toHaveBeenCalledTimes(1);
  });
});
