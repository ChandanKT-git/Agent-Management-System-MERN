import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import DistributionList from '../DistributionList'
import { distributionService } from '../../../services/distributionService'
import { NotificationProvider } from '../../../contexts/NotificationContext'

// Mock the distribution service
vi.mock('../../../services/distributionService', () => ({
    distributionService: {
        getAllDistributions: vi.fn()
    }
}))

const mockDistributions = [
    {
        id: '1',
        filename: 'test-file-1.csv',
        originalName: 'Test File 1.csv',
        totalItems: 100,
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z'
    },
    {
        id: '2',
        filename: 'test-file-2.csv',
        originalName: 'Test File 2.csv',
        totalItems: 50,
        status: 'processing',
        createdAt: '2024-01-16T11:00:00Z'
    }
]

const renderWithProviders = (component) => {
    return render(
        <BrowserRouter>
            <NotificationProvider>
                {component}
            </NotificationProvider>
        </BrowserRouter>
    )
}

describe('DistributionList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading state initially', () => {
        distributionService.getAllDistributions.mockImplementation(() => new Promise(() => { }))

        renderWithProviders(<DistributionList />)

        expect(screen.getByText('Loading distributions...')).toBeInTheDocument()
    })

    it('renders distributions list when data is loaded', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)

        renderWithProviders(<DistributionList />)

        await waitFor(() => {
            expect(screen.getByText('All Distributions')).toBeInTheDocument()
        })

        expect(screen.getByText('test-file-1.csv')).toBeInTheDocument()
        expect(screen.getByText('test-file-2.csv')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
        expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('renders empty state when no distributions exist', async () => {
        distributionService.getAllDistributions.mockResolvedValue([])

        renderWithProviders(<DistributionList />)

        await waitFor(() => {
            expect(screen.getByText('No distributions yet')).toBeInTheDocument()
        })

        expect(screen.getByText('Upload your first CSV file to start distributing tasks to agents.')).toBeInTheDocument()
    })

    it('filters distributions by search text', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)

        renderWithProviders(<DistributionList />)

        await waitFor(() => {
            expect(screen.getByText('test-file-1.csv')).toBeInTheDocument()
        })

        const searchInput = screen.getByPlaceholderText('Search distributions...')
        fireEvent.change(searchInput, { target: { value: 'test-file-1' } })

        expect(screen.getByText('test-file-1.csv')).toBeInTheDocument()
        expect(screen.queryByText('test-file-2.csv')).not.toBeInTheDocument()
    })

    it('sorts distributions by filename', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)

        renderWithProviders(<DistributionList />)

        await waitFor(() => {
            expect(screen.getByText('test-file-1.csv')).toBeInTheDocument()
        })

        const filenameHeader = screen.getByText(/Filename/)
        fireEvent.click(filenameHeader)

        // Check that sorting icons are present
        expect(filenameHeader).toHaveTextContent('↑')
    })

    it('sorts distributions by total items', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)

        renderWithProviders(<DistributionList />)

        await waitFor(() => {
            expect(screen.getByText('test-file-1.csv')).toBeInTheDocument()
        })

        const totalItemsHeader = screen.getByText(/Total Items/)
        fireEvent.click(totalItemsHeader)

        expect(totalItemsHeader).toHaveTextContent('↑')
    })

    it('shows filtered empty state when search has no results', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)

        renderWithProviders(<DistributionList />)

        await waitFor(() => {
            expect(screen.getByText('test-file-1.csv')).toBeInTheDocument()
        })

        const searchInput = screen.getByPlaceholderText('Search distributions...')
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

        expect(screen.getByText('No distributions found')).toBeInTheDocument()
        expect(screen.getByText('No distributions match your search criteria.')).toBeInTheDocument()
    })

    it('clears search filter when clear button is clicked', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)

        renderWithProviders(<DistributionList />)

        await waitFor(() => {
            expect(screen.getByText('test-file-1.csv')).toBeInTheDocument()
        })

        const searchInput = screen.getByPlaceholderText('Search distributions...')
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

        const clearButton = screen.getByText('Clear Search')
        fireEvent.click(clearButton)

        expect(searchInput.value).toBe('')
        expect(screen.getByText('test-file-1.csv')).toBeInTheDocument()
        expect(screen.getByText('test-file-2.csv')).toBeInTheDocument()
    })

    it('renders view details links for each distribution', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)

        renderWithProviders(<DistributionList />)

        await waitFor(() => {
            expect(screen.getByText('test-file-1.csv')).toBeInTheDocument()
        })

        const viewDetailsLinks = screen.getAllByText('View Details')
        expect(viewDetailsLinks).toHaveLength(2)

        expect(viewDetailsLinks[0]).toHaveAttribute('href', '/distributions/2')
        expect(viewDetailsLinks[1]).toHaveAttribute('href', '/distributions/1')
    })
})