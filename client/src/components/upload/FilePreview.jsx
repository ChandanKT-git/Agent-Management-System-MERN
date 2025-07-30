import React from 'react'
import './FilePreview.css'

const FilePreview = ({ data, fileName }) => {
    if (!data) return null

    const { headers, rows, totalRows, requiredColumns } = data

    return (
        <div className="file-preview">
            <div className="file-preview-header">
                <h3>File Preview</h3>
                <div className="file-preview-info">
                    <span className="preview-filename">{fileName}</span>
                    <span className="preview-stats">
                        {totalRows} total rows • Showing first {Math.min(5, rows.length)} rows
                    </span>
                </div>
            </div>

            <div className="column-validation">
                <h4>Column Validation</h4>
                <div className="validation-results">
                    {requiredColumns.map(column => (
                        <div key={column} className="validation-item success">
                            <span className="validation-icon">✓</span>
                            <span className="validation-text">{column} column found</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="preview-table-container">
                <table className="preview-table">
                    <thead>
                        <tr>
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    className={requiredColumns.some(col =>
                                        col.toLowerCase() === header.toLowerCase()
                                    ) ? 'required-column' : ''}
                                >
                                    {header}
                                    {requiredColumns.some(col =>
                                        col.toLowerCase() === header.toLowerCase()
                                    ) && <span className="required-indicator">*</span>}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {headers.map((header, colIndex) => (
                                    <td key={colIndex}>
                                        <div className="cell-content">
                                            {row[header] || <span className="empty-cell">—</span>}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalRows > 5 && (
                <div className="preview-footer">
                    <p className="preview-note">
                        Preview shows first 5 rows. All {totalRows} rows will be processed during upload.
                    </p>
                </div>
            )}
        </div>
    )
}

export default FilePreview