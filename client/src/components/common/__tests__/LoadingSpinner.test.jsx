import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
    it('renders loading spinner with default message', () => {
        render(<LoadingSpinner />)

        expect(screen.getByText('Loading...')).toBeInTheDocument()
        expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('renders loading spinner with custom message', () => {
        render(<LoadingSpinner message="Processing your request..." />)

        expect(screen.getByText('Processing your request...')).toBeInTheDocument()
        expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('renders loading spinner with custom size', () => {
        render(<LoadingSpinner size="large" />)

        const spinner = screen.getByRole('status')
        expect(spinner).toHaveClass('loading-spinner', 'large')
    })

    it('renders loading spinner with small size', () => {
        render(<LoadingSpinner size="small" />)

        const spinner = screen.getByRole('status')
        expect(spinner).toHaveClass('loading-spinner', 'small')
    })

    it('renders loading spinner with default size when no size specified', () => {
        render(<LoadingSpinner />)

        const spinner = screen.getByRole('status')
        expect(spinner).toHaveClass('loading-spinner')
        expect(spinner).not.toHaveClass('small')
        expect(spinner).not.toHaveClass('large')
    })

    it('has proper accessibility attributes', () => {
        render(<LoadingSpinner />)

        const spinner = screen.getByRole('status')
        expect(spinner).toHaveAttribute('aria-live', 'polite')
        expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })

    it('renders with custom aria-label', () => {
        render(<LoadingSpinner ariaLabel="Processing data" />)

        const spinner = screen.getByRole('status')
        expect(spinner).toHaveAttribute('aria-label', 'Processing data')
    })

    it('renders without message when showMessage is false', () => {
        render(<LoadingSpinner showMessage={false} />)

        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
        expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('applies custom className', () => {
        render(<LoadingSpinner className="custom-spinner" />)

        const spinner = screen.getByRole('status')
        expect(spinner).toHaveClass('loading-spinner', 'custom-spinner')
    })
})