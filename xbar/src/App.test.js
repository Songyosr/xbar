import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Speakeasy title', () => {
  render(<App />);
  const title = screen.getByText(/Speakeasy Playground/i);
  expect(title).toBeInTheDocument();
});
