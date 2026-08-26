import { render, screen } from '@testing-library/react';
import App from './App';

test('renders age group selection', () => {
  render(<App />);
  const heading = screen.getByText(/KodeKids/i);
  expect(heading).toBeInTheDocument();
});
