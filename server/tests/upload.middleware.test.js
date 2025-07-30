const request = require('supertest');
const express = require('express');
const uploadMiddleware = require('../middleware/upload');
const { uploadFile, validateFile } = require('../controllers/uploadController');
const XLSX = require('xlsx');

// Create a simple test app
const createTestApp = () => {
    const app = express();

    app.use(express.json());

    // Mock auth middleware for testing
    app.use((req, res, next) => {
        req.user = { _id: 'test-user-id', email: 'test@example.com' };
        next();
    });

    // Test routes
    app.post('/upload', uploadMiddleware, uploadFile);
    app.post('/validate', uploadMiddleware, validateFile);

    // Error handling
    app.use((err, req, res, next) => {
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: err.message
            }
        });
    });

    return app;
};

describe('Upload Middleware Tests', () => {
    let app;

    beforeAll(() => {
        app = createTestApp();
    });

    describe('File Upload Middleware', () => {
        it('should accept valid CSV file', async () => {
            const csvData = 'FirstName,Phone,Notes\nJohn,1234567890,Test note';

            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from(csvData), 'test.csv')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.filename).toBe('test.csv');
            expect(response.body.data.totalRows).toBe(1);
        });

        it('should accept valid Excel file', async () => {
            const ws = XLSX.utils.aoa_to_sheet([
                ['FirstName', 'Phone', 'Notes'],
                ['John', '1234567890', 'Test note']
            ]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            const response = await request(app)
                .post('/upload')
                .attach('file', buffer, 'test.xlsx')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.filename).toBe('test.xlsx');
        });

        it('should reject unsupported file types', async () => {
            const textData = 'This is a text file';

            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from(textData), 'test.txt')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('UNSUPPORTED_FORMAT');
        });

        it('should reject files that are too large', async () => {
            // Create a large CSV file (over 5MB)
            const rowData = 'John,1234567890,Test note with lots of extra data to make it bigger and exceed the file size limit\n';
            const largeData = 'FirstName,Phone,Notes\n' + rowData.repeat(100000); // Should be over 5MB

            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from(largeData), 'large.csv')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FILE_TOO_LARGE');
        });

        it('should reject request without file', async () => {
            const response = await request(app)
                .post('/upload')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_FILE');
        });

        it('should reject files with missing columns', async () => {
            const csvData = 'Name,Phone\nJohn,1234567890';

            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from(csvData), 'test.csv')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_COLUMNS');
        });

        it('should reject files with invalid data', async () => {
            const csvData = 'FirstName,Phone,Notes\n,1234567890,Test note';

            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from(csvData), 'test.csv')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_DATA');
        });
    });

    describe('File Validation Endpoint', () => {
        it('should validate file and return preview', async () => {
            const csvData = 'FirstName,Phone,Notes\nJohn,1234567890,Test note\nJane,0987654321,Another note\nBob,5555555555,Third note\nAlice,4444444444,Fourth note\nCharlie,3333333333,Fifth note\nDave,2222222222,Sixth note';

            const response = await request(app)
                .post('/validate')
                .attach('file', Buffer.from(csvData), 'test.csv')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.filename).toBe('test.csv');
            expect(response.body.data.totalRows).toBe(6);
            expect(response.body.data.preview).toHaveLength(5); // Should limit to 5 rows
            expect(response.body.data.columns).toEqual(['FirstName', 'Phone', 'Notes']);
        });

        it('should validate Excel file and return preview', async () => {
            const ws = XLSX.utils.aoa_to_sheet([
                ['FirstName', 'Phone', 'Notes'],
                ['John', '1234567890', 'Test note'],
                ['Jane', '0987654321', 'Another note']
            ]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            const response = await request(app)
                .post('/validate')
                .attach('file', buffer, 'test.xlsx')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.filename).toBe('test.xlsx');
            expect(response.body.data.totalRows).toBe(2);
            expect(response.body.data.preview).toHaveLength(2);
        });
    });

    describe('Error Handling', () => {
        it('should handle empty files gracefully', async () => {
            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from(''), 'empty.csv')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('EMPTY_FILE');
        });

        it('should handle corrupted Excel files', async () => {
            const corruptedData = Buffer.from('corrupted excel data');

            const response = await request(app)
                .post('/upload')
                .attach('file', corruptedData, 'corrupted.xlsx')
                .expect(400);

            expect(response.body.success).toBe(false);
            // The actual error code might be different based on how XLSX handles invalid data
            expect(['EXCEL_PARSE_ERROR', 'EMPTY_WORKSHEET', 'NO_WORKSHEETS'].includes(response.body.error.code)).toBe(true);
        });
    });
});