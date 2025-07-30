import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { distributionService } from '../../services/distributionService'
import { useNotification } from '../../contexts/NotificationContext'

const DistributionList = () => {
    const [distributions, setDistributions] = useState([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterText, setFilterText] = useState('')
    const { showNotification } = useNotification()

    useEffect(() => {
        const fetchDistributions = async () => {
            try {
                setLoading(true)
                const data = await distributionService.getAllDistributions()
                setDistributions(data)
            } catch (error) {
                showNotification('Failed to load distributions', 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchDistributions()
    }, [showNotification])

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
    }

    const filteredAndSortedDistributions = distributions
        .filter(distribution =>
            distribution.filename.toLowerCase().includes(filterText.toLowerCase()) ||
            distribution.originalName?.toLowerCase().includes(filterText.toLowerCase())
        )
        .sort((a, b) => {
            let aValue = a[sortBy]
            let bValue = b[sortBy]

            if (sortBy === 'createdAt') {
                aValue = new Date(aValue)
                bValue = new Date(bValue)
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })

    const getSortIcon = (field) => {
        if (sortBy !== field) return '↕️'
        return sortOrder === 'asc' ? '↑' : '↓'
    }

    if (loading) {
        return (
            <div className="distribution-list-container">
                <div className="loading-spinner">Loading distributions...</div>
            </div>
        )
    }

    return (
        <div className="distribution-list-container">
            <div className="distribution-list-header">
                <h1>All Distributions</h1>
                <Link to="/upload" className="btn btn-primary">Upload New File</Link>
            </div>

            <div className="distribution-controls">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search distributions..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {filteredAndSortedDistributions.length > 0 ? (
                <div className="distribution-table-container">
                    <table className="distribution-table">
                        <thead>
                            <tr>
                                <th
                                    onClick={() => handleSort('filename')}
                                    className="sortable-header"
                                >
                                    Filename {getSortIcon('filename')}
                                </th>
                                <th
                                    onClick={() => handleSort('totalItems')}
                                    className="sortable-header"
                                >
                                    Total Items {getSortIcon('totalItems')}
                                </th>
                                <th
                                    onClick={() => handleSort('status')}
                                    className="sortable-header"
                                >
                                    Status {getSortIcon('status')}
                                </th>
                                <th
                                    onClick={() => handleSort('createdAt')}
                                    className="sortable-header"
                                >
                                    Created At {getSortIcon('createdAt')}
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedDistributions.map(distribution => (
                                <tr key={distribution.id}>
                                    <td>
                                        <div className="filename-cell">
                                            <strong>{distribution.filename}</strong>
                                            {distribution.originalName && (
                                                <small>({distribution.originalName})</small>
                                            )}
                                        </div>
                                    </td>
                                    <td>{distribution.totalItems}</td>
                                    <td>
                                        <span className={`status-badge status-${distribution.status || 'completed'}`}>
                                            {distribution.status || 'completed'}
                                        </span>
                                    </td>
                                    <td>{new Date(distribution.createdAt).toLocaleString()}</td>
                                    <td>
                                        <Link
                                            to={`/distributions/${distribution.id}`}
                                            className="btn btn-sm btn-outline"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    {filterText ? (
                        <div>
                            <h3>No distributions found</h3>
                            <p>No distributions match your search criteria.</p>
                            <button
                                onClick={() => setFilterText('')}
                                className="btn btn-outline"
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h3>No distributions yet</h3>
                            <p>Upload your first CSV file to start distributing tasks to agents.</p>
                            <Link to="/upload" className="btn btn-primary">
                                Upload File
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default DistributionList