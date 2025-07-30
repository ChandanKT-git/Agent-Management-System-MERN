import React from 'react'
import { render, screen } from '@testing-library/react'
import FilePreview from '../FilePreview'

describe('FilePreview Component', () => {
    const mockData = {
        headers: ['FirstName', 'LastName', 'Phone', 'Notes'],
        rows: [
            { FirstName: 'John', LastName: 'Doe', Phone: '123-456-7890', Notes: 'Test note 1' },
            { FirstName: 'Jane', LastName: 'Smith', Phone: '098-765-4321', Notes: 'Test note 2' },
            { FirstName: 'Bob', LastName: 'Johnson', Phone: '555-123-4567', Notes: 'Test note 3' }
        ],
        totalRows: 100,
        requiredColumns: ['FirstName', 'Phone', 'Notes']
    }

    test('renders preview with correct data', () => {
        render(<FilePreview data={mockData} fileName="test.csv" />)

        expect(screen.getByText('File Preview')).toBeInTheDocument()
        expect(screen.getByText('test.csv')).toBeInTheDocument()
        expect(screen.getByText('100 total rows • Showing first 3 rows')).toBeInTheDocument()
    })

    test('displays column validation correctly', () => {
        render(<FilePreview data={mockData} fileName="test.csv" />)

        expect(screen.getByText('Column Validation')).toBeInTheDocument()
        expect(screen.getByText('FirstName column found')).toBeInTheDocument()
        expect(screen.getByText('Phone column found')).toBeInTheDocument()
        expect(screen.getByText('Notes column found')).toBeInTheDocument()
    })

    test('renders table headers correctly', () => {
        render(<FilePreview data={mockData} fileName="test.csv" />)

        mockData.headers.forEach(header => {
            expect(screen.getByText(header)).toBeInTheDocument()
        })
    })

    test('marks required columns with indicator', () => {
        render(<FilePreview data={mockData} fileName="test.csv" />)

        // Required columns should have asterisk indicators
        const requiredHeaders = screen.getAllByText('*')
        expect(requiredHeaders).toHaveLength(3) // FirstName, Phone, Notes
    })

    test('displays table data correctly', () => {
        render(<FilePreview data={mockData} fileName="test.csv" />)

        // Check first row data
        expect(screen.getByText('John')).toBeInTheDocument()
        expect(screen.getByText('Doe')).toBeInTheDocument()
        expect(screen.getByText('123-456-7890')).toBeInTheDocument()
        expect(screen.getByText('Test note 1')).toBeInTheDocument()

        // Check second row data
        expect(screen.getByText('Jane')).toBeInTheDocument()
        expect(screen.getByText('Smith')).toBeInTheDocument()
        expect(screen.getByText('098-765-4321')).toBeInTheDocument()
        expect(screen.getByText('Test note 2')).toBeInTheDocument()
    })

    test('shows preview footer when more rows exist', () => {
        render(<FilePreview data={mockData} fileName="test.csv" />)

        expect(screen.getByText(/Preview shows first 5 rows. All 100 rows will be processed/)).toBeInTheDocument()
    })

    test('does not show footer when showing all rows', () => {
        const smallData = {
            ...mockData,
            totalRows: 3
        }

        render(<FilePreview data={smallData} fileName="test.csv" />)

        expect(screen.queryByText(/Preview shows first 5 rows/)).not.toBeInTheDocument()
    })

    test('handles empty cells correctly', () => {
        const dataWithEmptyCells = {
            headers: ['FirstName', 'Phone', 'Notes'],
            rows: [
                { FirstName: 'John', Phone: '123-456-7890', Notes: '' },
                { FirstName: '', Phone: '098-765-4321', Notes: 'Test note' }
            ],
            totalRows: 2,
            requiredColumns: ['FirstName', 'Phone', 'Notes']
        }

        render(<FilePreview data={dataWithEmptyCells} fileName="test.csv" />)

        // Empty cells should show em dash
        const emptyCells = screen.getAllByText('—')
        expect(emptyCells.length).toBeGreaterThan(0)
    })

    test('returns null when no data provided', () => {
        const { container } = render(<FilePreview data={null} fileName="test.csv" />)
        expect(container.firstChild).toBeNull()
    })

    test('handles missing required columns gracefully', () => {
        const dataWithMissingColumns = {
            headers: ['FirstName', 'Email'],
            rows: [
                { FirstName: 'John', Email: 'john@example.com' }
            ],
            totalRows: 1,
            requiredColumns: ['FirstName'] // Only FirstName is found
        }

        render(<FilePreview data={dataWithMissingColumns} fileName="test.csv" />)

        expect(screen.getByText('FirstName column found')).toBeInTheDocument()
        expect(screen.queryByText('Phone column found')).not.toBeInTheDocument()
        expect(screen.queryByText('Notes column found')).not.toBeInTheDocument()
    })
})