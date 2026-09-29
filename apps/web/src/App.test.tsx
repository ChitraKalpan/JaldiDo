import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('JaldiDo app', () => {
  it('renders the landing page headline', () => {
    render(<App />);
    expect(screen.getAllByText(/JaldiDo/i).length).toBeGreaterThan(0);
  });
});
