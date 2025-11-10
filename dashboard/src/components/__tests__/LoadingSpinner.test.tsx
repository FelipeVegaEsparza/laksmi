import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    const customMessage = 'Procesando datos...'
    render(<LoadingSpinner message={customMessage} />)
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })
})