import { render, screen, fireEvent } from '@testing-library/react-native';
import { EtoilesNote } from '@/components/EtoilesNote';

describe('components/EtoilesNote', () => {
  it('affiche une note en lecture seule sans interaction possible', () => {
    render(<EtoilesNote note={3} />);
    expect(screen.getByText('★★★☆☆')).toBeTruthy();
  });

  it('affiche un tiret quand aucune note n\u2019est définie, en lecture seule', () => {
    render(<EtoilesNote note={null} />);
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('appelle onChange avec la valeur de l\u2019étoile pressée, en mode interactif', () => {
    const onChange = jest.fn();
    render(<EtoilesNote note={2} onChange={onChange} />);
    fireEvent.press(screen.getByRole('radio', { name: '4 étoiles' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('n\u2019appelle jamais onChange quand le composant est désactivé', () => {
    const onChange = jest.fn();
    render(<EtoilesNote note={2} onChange={onChange} desactive />);
    fireEvent.press(screen.getByRole('radio', { name: '4 étoiles' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
