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

test('renders dashboard header', async () => {
  render(<App />);
  const header = await screen.findByText(/Salesforce Cert Dashboard/i);
  expect(header).toBeInTheDocument();
});
