import { render, screen } from '@testing-library/react';
import App from './App';

// Verifica que la aplicación renderice su contenido base sin romperse al iniciar.
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
