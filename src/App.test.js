import { render, screen } from '@testing-library/react';
import App from './App';

const COLOR_NAMES = [
  'white',
  'black',
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'purple',
];

test('renders the Colors title and every color button', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /colors/i })).toBeInTheDocument();

  COLOR_NAMES.forEach((name) => {
    expect(screen.getByRole('button', { name })).toBeInTheDocument();
  });
});
