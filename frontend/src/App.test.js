import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders Certification Overview heading', async () => {
  render(<App />);
  const headingElement = await screen.findByText(/Certification Overview/i);
  expect(headingElement).toBeInTheDocument();
});