import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Certification Overview heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Certification Overview/i);
  expect(headingElement).toBeInTheDocument();
});
