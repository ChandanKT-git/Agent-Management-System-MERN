import {
    sanitizeInput,
    validateEmail,
    validatePhone,
    validateRequired,
    validatePasswordStrength,
    getPasswordStrength,
    validateFileType
} from '../validation';

describe('Client-Side Security Validation', () => {
    describe('Input Sanitization', () => {
        test('should sanitize script tags', () => {
            const maliciousInput = '<script>alert("XSS")</script>Hello World';
            const sanitized = sanitizeInput(maliciousInput);
            expect(sanitized).toBe('Hello World');
            expect(sanitized).not.toContain('<script>');
        });

        test('should sanitize javascript protocol', () => {
            const maliciousInput = 'javascript:alert("XSS")';
            const sanitized = sanitizeInput(maliciousInput);
            expect(sanitized).toBe('alert("XSS")');
            expect(sanitized).not.toContain('javascript:');
        });

        test('should sanitize event handlers', () => {
            const maliciousInput = 'onload=alert("XSS") onclick=alert("XSS")';
            const sanitized = sanitizeInput(maliciousInput);
            expect(sanitized).not.toContain('onload=');
            expect(sanitized).not.toContain('onclick=');
        });

        test('should remove angle brackets', () => {
            const maliciousInput = '<img src=x onerror=alert(1)>';
            const sanitized = sanitizeInput(maliciousInput);
            expect(sanitized).not.toContain('<');
            expect(sanitized).not.toContain('>');
        });

        test('should handle non-string inputs', () => {
            expect(sanitizeInput(123)).toBe(123);
            expect(sanitizeInput(null)).toBe(null);
            expect(sanitizeInput(undefined)).toBe(undefined);
            expect(sanitizeInput({})).toEqual({});
        });
    });

    describe('Email Validation Security', () => {
        test('should validate legitimate emails', () => {
            const validEmails = [
                'user@example.com',
                'test.email@domain.co.uk',
                'user+tag@example.org'
            ];

            validEmails.forEach(email => {
                expect(validateEmail(email)).toBe(true);
            });
        });

        test('should reject malicious email patterns', () => {
            const maliciousEmails = [
                'user@example.com<script>alert("XSS")</script>',
                'javascript:alert("XSS")@example.com',
                'user@example.com onload=alert("XSS")',
                'user@example.com<img src=x onerror=alert(1)>',
                '<script>alert("XSS")</script>@example.com'
            ];

            maliciousEmails.forEach(email => {
                expect(validateEmail(email)).toBe(false);
            });
        });

        test('should reject emails with suspicious content', () => {
            const suspiciousEmails = [
                'user@example.com vbscript:alert("XSS")',
                'user@example.com onerror=alert(1)',
                'script@example.com'
            ];

            suspiciousEmails.forEach(email => {
                expect(validateEmail(email)).toBe(false);
            });
        });

        test('should handle non-string inputs', () => {
            expect(validateEmail(null)).toBe(false);
            expect(validateEmail(undefined)).toBe(false);
            expect(validateEmail(123)).toBe(false);
            expect(validateEmail({})).toBe(false);
        });
    });

    describe('Phone Validation Security', () => {
        test('should validate legitimate phone numbers', () => {
            const validPhones = [
                '+1234567890',
                '(555) 123-4567',
                '+44 20 7946 0958',
                '555-123-4567'
            ];

            validPhones.forEach(phone => {
                expect(validatePhone(phone)).toBe(true);
            });
        });

        test('should reject malicious phone patterns', () => {
            const maliciousPhones = [
                '+1234567890<script>alert("XSS")</script>',
                'javascript:alert("XSS")',
                '+1234567890 onload=alert("XSS")',
                '<img src=x onerror=alert(1)>+1234567890'
            ];

            maliciousPhones.forEach(phone => {
                expect(validatePhone(phone)).toBe(false);
            });
        });

        test('should handle non-string inputs', () => {
            expect(validatePhone(null)).toBe(false);
            expect(validatePhone(undefined)).toBe(false);
            expect(validatePhone(123)).toBe(false);
            expect(validatePhone({})).toBe(false);
        });
    });

    describe('Required Field Validation Security', () => {
        test('should validate legitimate required fields', () => {
            expect(validateRequired('Valid input')).toBe(true);
            expect(validateRequired('  Valid input  ')).toBe(true);
            expect(validateRequired(123)).toBe(true);
        });

        test('should reject empty or malicious inputs', () => {
            expect(validateRequired('')).toBe(false);
            expect(validateRequired('   ')).toBe(false);
            expect(validateRequired(null)).toBe(false);
            expect(validateRequired(undefined)).toBe(false);
        });

        test('should handle inputs that become empty after sanitization', () => {
            const maliciousInputs = [
                '<script></script>',
                'javascript:',
                '<>'
            ];

            maliciousInputs.forEach(input => {
                expect(validateRequired(input)).toBe(false);
            });
        });
    });

    describe('Password Strength Validation', () => {
        test('should validate strong passwords', () => {
            const strongPasswords = [
                'SecurePass123!',
                'MyStr0ng@Password',
                'C0mpl3x#P@ssw0rd'
            ];

            strongPasswords.forEach(password => {
                const result = validatePasswordStrength(password);
                if (!result) {
                    console.log(`Password "${password}" failed validation`);
                    console.log('Strength analysis:', getPasswordStrength(password));
                }
                expect(result).toBe(true);
            });
        });

        test('should reject weak passwords', () => {
            const weakPasswords = [
                'password',
                '123456',
                'qwerty',
                'admin',
                'Password', // Missing number and special char
                'password123', // Missing uppercase and special char
                'PASSWORD123!', // Missing lowercase
                'Password!', // Missing number
                'aaaaaaa!' // Repeated characters
            ];

            weakPasswords.forEach(password => {
                expect(validatePasswordStrength(password)).toBe(false);
            });
        });

        test('should provide detailed password strength feedback', () => {
            const testCases = [
                {
                    password: '',
                    expectedScore: 0,
                    expectedFeedback: 'Password is required'
                },
                {
                    password: 'weak',
                    expectedScore: 1,
                    expectedFeedback: 'Missing: At least 8 characters, One uppercase letter, One number, One special character'
                },
                {
                    password: 'SecurePass123!',
                    expectedScore: 5,
                    expectedFeedback: 'Strong password!'
                }
            ];

            testCases.forEach(({ password, expectedScore, expectedFeedback }) => {
                const result = getPasswordStrength(password);
                expect(result.score).toBe(expectedScore);
                expect(result.feedback).toBe(expectedFeedback);
            });
        });
    });

    describe('File Type Validation Security', () => {
        test('should validate legitimate file types', () => {
            const validFiles = [
                { name: 'data.csv', type: 'text/csv' },
                { name: 'spreadsheet.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
                { name: 'legacy.xls', type: 'application/vnd.ms-excel' }
            ];

            const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

            validFiles.forEach(file => {
                expect(validateFileType(file, allowedTypes)).toBe(true);
            });
        });

        test('should reject malicious file types', () => {
            const maliciousFiles = [
                { name: 'malware.exe', type: 'application/x-executable' },
                { name: 'script.js', type: 'application/javascript' },
                { name: 'image.jpg', type: 'image/jpeg' },
                { name: 'document.pdf', type: 'application/pdf' }
            ];

            const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

            maliciousFiles.forEach(file => {
                expect(validateFileType(file, allowedTypes)).toBe(false);
            });
        });

        test('should sanitize malicious filenames', () => {
            const maliciousFile = {
                name: '../../../malicious<script>alert("XSS")</script>.csv',
                type: 'text/csv'
            };

            const allowedTypes = ['text/csv'];

            // The validation should still work even with malicious filename
            // because the function sanitizes the filename internally
            expect(validateFileType(maliciousFile, allowedTypes)).toBe(true);
        });

        test('should handle missing file properties', () => {
            const invalidFiles = [
                null,
                undefined,
                {},
                { name: 'test.csv' }, // Missing type
                { type: 'text/csv' } // Missing name
            ];

            const allowedTypes = ['text/csv'];

            invalidFiles.forEach(file => {
                expect(validateFileType(file, allowedTypes)).toBe(false);
            });
        });
    });

    describe('Cross-Site Scripting (XSS) Prevention', () => {
        test('should prevent XSS in various input contexts', () => {
            const xssPayloads = [
                '<script>alert("XSS")</script>',
                '<img src=x onerror=alert("XSS")>',
                '<svg onload=alert("XSS")>',
                'javascript:alert("XSS")',
                '<iframe src="javascript:alert(\'XSS\')"></iframe>',
                '<body onload=alert("XSS")>',
                '<div onclick=alert("XSS")>Click me</div>'
            ];

            xssPayloads.forEach(payload => {
                const sanitized = sanitizeInput(payload);
                expect(sanitized).not.toContain('<script');
                expect(sanitized).not.toContain('javascript:');
                expect(sanitized).not.toContain('onload');
                expect(sanitized).not.toContain('onerror');
                expect(sanitized).not.toContain('onclick');
                expect(sanitized).not.toContain('<iframe');
                expect(sanitized).not.toContain('<svg');
                expect(sanitized).not.toContain('<img');
            });
        });
    });
});