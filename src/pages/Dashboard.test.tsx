import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock the KioskButton component to simplify testing
vi.mock('../components/KioskButton', () => ({
  KioskButton: ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button data-testid="kiosk-button" onClick={onClick}>
      {label}
    </button>
  ),
}));

describe('Dashboard Component', () => {
  it('renders the dashboard title', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Centro de/i)).toBeInTheDocument();
    expect(screen.getByText(/Impresión Fotográfica/i)).toBeInTheDocument();
  });

  it('renders default templates', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Check if the default templates are rendered
    expect(screen.getByText('Tamaño Carnet')).toBeInTheDocument();
    expect(screen.getByText('Foto Pasaporte')).toBeInTheDocument();
    expect(screen.getByText('Foto Postal')).toBeInTheDocument();
  });
});
