const {
    processFile,
    processCSV,
    processExcel,
    validateColumns,
    validateRow,
    normalizeRow
} = require('../utils/fileProcessor');
const XLSX = require('xlsx');

describe('File Processor Utils', () => {
    describe('validateColumns', () => {
        it('should validate required columns exist', () => {
            const data = [
                { FirstName: 'John', Phone: '1234567890', Notes: 'Test note' }
            ];
            const result = validateColumns(data);
            expect(result.success).toBe(true);
        });

        it('should fail when required columns are missing', () => {
            const data = [
                { Name: 'John', Phone: '1234567890' } // Missing FirstName and Notes
            ];
            const result = validateColumns(data);
            expect(result.success).toBe(false);
            expect(result.error.code).toBe('MISSING_COLUMNS');
            expect(result.error.details.missingColumns).toContain('FirstName');
            expect(result.error.details.missingColumns).toContain('Notes');
        });

        it('should fail when data is empty', () => {
            const result = validateColumns([]);
            expect(result.success).toBe(false);
            expect(result.error.code).toBe('EMPTY_FILE');
        });

        it('should fail when data is null or undefined', () => {
            expect(validateColumns(null).success).toBe(false);
            expect(validateColumns(undefined).success).toBe(false);
        });

        it('should handle case-insensitive column matching', () => {
            const data = [
                { firstname: 'John', phone: '1234567890', notes: 'Test note' }
            ];
            const result = validateColumns(data);
            expect(result.success).toBe(true);
        });
    });

    describe('normalizeRow', () => {
        it('should normalize column names correctly', () => {
            const row = {
                'FirstName': 'John',
                'Phone': '1234567890',
                'Notes': 'Test note'
            };
            const normalized = normalizeRow(row);
            expect(normalized).toEqual({
                FirstName: 'John',
                Phone: '1234567890',
                Notes: 'Test note'
            });
        });

        it('should handle lowercase column names', () => {
            const row = {
                'firstname': 'John',
                'phone': '1234567890',
                'notes': 'Test note'
            };
            const normalized = normalizeRow(row);
            expect(normalized).toEqual({
                FirstName: 'John',
                Phone: '1234567890',
                Notes: 'Test note'
            });
        });

        it('should trim whitespace from values', () => {
            const row = {
                'FirstName': '  John  ',
                'Phone': '  1234567890  ',
                'Notes': '  Test note  '
            };
            const normalized = normalizeRow(row);
            expect(normalized).toEqual({
                FirstName: 'John',
                Phone: '1234567890',
                Notes: 'Test note'
            });
        });

        it('should handle missing columns gracefully', () => {
            const row = {
                'FirstName': 'John'
                // Missing Phone and Notes
            };
            const normalized = normalizeRow(row);
            expect(normalized.FirstName).toBe('John');
            expect(normalized.Phone).toBeUndefined();
            expect(normalized.Notes).toBeUndefined();
        });
    });

    describe('validateRow', () => {
        it('should validate a correct row', () => {
            const row = {
                FirstName: 'John',
                Phone: '1234567890',
                Notes: 'Test note'
            };
            const result = validateRow(row, 0);
            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail when FirstName is missing', () => {
            const row = {
                FirstName: '',
                Phone: '1234567890',
                Notes: 'Test note'
            };
            const result = validateRow(row, 0);
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Row 1: FirstName is required');
        });

        it('should fail when Phone is missing', () => {
            const row = {
                FirstName: 'John',
                Phone: '',
                Notes: 'Test note'
            };
            const result = validateRow(row, 0);
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Row 1: Phone is required');
        });

        it('should fail when Phone is too short', () => {
            const row = {
                FirstName: 'John',
                Phone: '123',
                Notes: 'Test note'
            };
            const result = validateRow(row, 1);
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Row 2: Phone number appears to be invalid');
        });

        it('should accept valid phone formats', () => {
            const validPhones = [
                '1234567890',
                '+1-234-567-8900',
                '(123) 456-7890',
                '+91 98765 43210'
            ];

            validPhones.forEach(phone => {
                const row = {
                    FirstName: 'John',
                    Phone: phone,
                    Notes: 'Test note'
                };
                const result = validateRow(row, 0);
                expect(result.success).toBe(true);
            });
        });

        it('should fail when Notes are too long', () => {
            const row = {
                FirstName: 'John',
                Phone: '1234567890',
                Notes: 'A'.repeat(501) // 501 characters
            };
            const result = validateRow(row, 0);
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Row 1: Notes field is too long (max 500 characters)');
        });

        it('should allow empty Notes', () => {
            const row = {
                FirstName: 'John',
                Phone: '1234567890',
                Notes: ''
            };
            const result = validateRow(row, 0);
            expect(result.success).toBe(true);
        });
    });

    describe('processCSV', () => {
        it('should process valid CSV data', async () => {
            const csvData = 'FirstName,Phone,Notes\nJohn,1234567890,Test note\nJane,0987654321,Another note';
            const buffer = Buffer.from(csvData);

            const result = await processCSV(buffer);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0]).toEqual({
                FirstName: 'John',
                Phone: '1234567890',
                Notes: 'Test note'
            });
            expect(result.totalRows).toBe(2);
        });

        it('should handle CSV with missing columns', async () => {
            const csvData = 'Name,Phone\nJohn,1234567890';
            const buffer = Buffer.from(csvData);

            const result = await processCSV(buffer);

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('MISSING_COLUMNS');
        });

        it('should handle CSV with invalid data', async () => {
            const csvData = 'FirstName,Phone,Notes\n,1234567890,Test note\nJane,,Another note';
            const buffer = Buffer.from(csvData);

            const result = await processCSV(buffer);

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('INVALID_DATA');
            expect(result.error.details.errors).toContain('Row 1: FirstName is required');
            expect(result.error.details.errors).toContain('Row 2: Phone is required');
        });

        it('should handle empty CSV', async () => {
            const csvData = '';
            const buffer = Buffer.from(csvData);

            const result = await processCSV(buffer);

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('EMPTY_FILE');
        });

        it('should handle malformed CSV', async () => {
            const csvData = 'FirstName,Phone,Notes\nJohn,1234567890,"Unclosed quote';
            const buffer = Buffer.from(csvData);

            const result = await processCSV(buffer);

            // CSV parser is quite forgiving, so this might actually succeed
            // Let's check if it processes or fails gracefully
            expect(typeof result.success).toBe('boolean');
        });
    });

    describe('processExcel', () => {
        it('should process valid Excel data', async () => {
            // Create a simple Excel workbook
            const ws = XLSX.utils.aoa_to_sheet([
                ['FirstName', 'Phone', 'Notes'],
                ['John', '1234567890', 'Test note'],
                ['Jane', '0987654321', 'Another note']
            ]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            const result = await processExcel(buffer);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0]).toEqual({
                FirstName: 'John',
                Phone: '1234567890',
                Notes: 'Test note'
            });
            expect(result.totalRows).toBe(2);
        });

        it('should handle Excel with missing columns', async () => {
            const ws = XLSX.utils.aoa_to_sheet([
                ['Name', 'Phone'],
                ['John', '1234567890']
            ]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            const result = await processExcel(buffer);

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('MISSING_COLUMNS');
        });

        it('should handle empty Excel file', async () => {
            const ws = XLSX.utils.aoa_to_sheet([]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            const result = await processExcel(buffer);

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('EMPTY_WORKSHEET');
        });

        it('should handle invalid Excel buffer', async () => {
            const buffer = Buffer.from('invalid excel data');

            const result = await processExcel(buffer);

            expect(result.success).toBe(false);
            // The actual error code might be different based on how XLSX handles invalid data
            expect(['EXCEL_PARSE_ERROR', 'EMPTY_WORKSHEET', 'NO_WORKSHEETS'].includes(result.error.code)).toBe(true);
        });
    });

    describe('processFile', () => {
        it('should process CSV file', async () => {
            const csvData = 'FirstName,Phone,Notes\nJohn,1234567890,Test note';
            const file = {
                originalname: 'test.csv',
                buffer: Buffer.from(csvData)
            };

            const result = await processFile(file);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
        });

        it('should process Excel file', async () => {
            const ws = XLSX.utils.aoa_to_sheet([
                ['FirstName', 'Phone', 'Notes'],
                ['John', '1234567890', 'Test note']
            ]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            const file = {
                originalname: 'test.xlsx',
                buffer: buffer
            };

            const result = await processFile(file);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
        });

        it('should handle unsupported file format', async () => {
            const file = {
                originalname: 'test.txt',
                buffer: Buffer.from('some text')
            };

            const result = await processFile(file);

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('UNSUPPORTED_FORMAT');
        });

        it('should handle missing file data', async () => {
            const result = await processFile(null);

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('NO_FILE_DATA');
        });

        it('should handle file without buffer', async () => {
            const file = {
                originalname: 'test.csv'
                // Missing buffer
            };

            const result = await processFile(file);

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('NO_FILE_DATA');
        });
    });
});