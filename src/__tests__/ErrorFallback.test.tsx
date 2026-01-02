import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorFallback } from '../ErrorFallback'

// Mock the UI components
vi.mock('../components/ui/alert', () => ({
  Alert: ({ children, ...props }: { children: React.ReactNode }) => <div data-testid="alert" {...props}>{children}</div>,
  AlertTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}))

vi.mock('../components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

vi.mock('lucide-react', () => ({
  AlertTriangleIcon: () => <span data-testid="alert-icon">⚠️</span>,
  RefreshCwIcon: () => <span data-testid="refresh-icon">🔄</span>,
}))

describe('ErrorFallback', () => {
  const mockResetErrorBoundary = vi.fn()
  const mockError = new Error('Test error message')

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock production environment
    vi.stubEnv('DEV', false)
  })

  it('renders error message', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('displays Application Error title', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    expect(screen.getByText('Application Error')).toBeInTheDocument()
  })

  it('shows error description', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    expect(screen.getByText(/Something unexpected happened/)).toBeInTheDocument()
  })

  it('renders Try Again button', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('calls resetErrorBoundary when Try Again is clicked', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1)
  })

  it('displays Error Details section', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    expect(screen.getByText('Error Details:')).toBeInTheDocument()
  })

  it('renders alert and refresh icons', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument()
  })

  it('handles errors with long messages', () => {
    const longError = new Error('A'.repeat(500))
    
    render(
      <ErrorFallback 
        error={longError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    expect(screen.getByText('A'.repeat(500))).toBeInTheDocument()
  })
})
