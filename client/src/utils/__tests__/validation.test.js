import { describe, it, expect } from 'vitest'
import {
    sanitizeInput,
    validateEmail,
    validatePhone,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validateFileType,
    validateCSVStructure,
    validateFileSize,
    validatePasswordStrength,
    getPasswordStrength,
    createValidator,
    required,
    email,
    minLength,
    maxLength,
    strongPassword,
    phoneNumber
} from '../validation'

describe('Validation Utils', () => {
    describe('sanitizeInput', () => {
        it('should remove script tags', () => {
            const input = '<script>alert("XSS")</script>Hello World'
            const result = sanitizeInput(input)
            expect(result).toBe('Hello World')
            expect(result).not.toContain('<script>')
        })

        it('should remove javascript protocol', () => {
            const input = 'javascript:alert("XSS")'
            const result = sanitizeInput(input)
            expect(result).toBe('alert("XSS")')
            expect(result).not.toContain('javascript:')
        })

        it('should remove event handlers', () => {
            const input = 'onload=alert("XSS") onclick=alert("XSS")'
            const result = sanitizeInput(input)
            expect(result).not.toContain('onload=')
            expect(result).not.toContain('onclick=')
        })

        it('should remove angle brackets', () => {
            const input = '<img src=x onerror=alert(1)>'
            const result = sanitizeInput(input)
            expect(result).not.toContain('<')
            expect(result).not.toContain('>')
        })

        it('should handle non-string inputs', () => {
            expect(sanitizeInput(123)).toBe(123)
            expect(sanitizeInput(null)).toBe(null)
            expect(sanitizeInput(undefined)).toBe(undefined)
            expect(sanitizeInput({})).toEqual({})
        })

        it('should trim whitespace', () => {
            const input = '  Hello World  '
            const result = sanitizeInput(input)
            expect(result).toBe('Hello World')
        })
    })

    describe('validateEmail', () => {
        it('should validate legitimate emails', () => {
            const validEmails = [
                'user@example.com',
                'test.email@domain.co.uk',
                'user+tag@example.org',
                'user123@test-domain.com'
            ]

            validEmails.forEach(email => {
                expect(validateEmail(email)).toBe(true)
            })
        })

        it('should reject invalid email formats', () => {
            const invalidEmails = [
                'invalid-email',
                '@example.com',
                'user@',
                'user@.com',
                'user..double@example.com',
                'user@example',
                ''
            ]

            invalidEmails.forEach(email => {
                expect(validateEmail(email)).toBe(false)
            })
        })

        it('should reject malicious email patterns', () => {
            const maliciousEmails = [
                'user@example.com<script>alert("XSS")</script>',
                'javascript:alert("XSS")@example.com',
                'user@example.com onload=alert("XSS")',
                'user@example.com<img src=x onerror=alert(1)>',
                '<script>alert("XSS")</script>@example.com'
            ]

            maliciousEmails.forEach(email => {
                expect(validateEmail(email)).toBe(false)
            })
        })

        it('should handle non-string inputs', () => {
            expect(validateEmail(null)).toBe(false)
            expect(validateEmail(undefined)).toBe(false)
            expect(validateEmail(123)).toBe(false)
            expect(validateEmail({})).toBe(false)
        })
    })

    describe('validatePhone', () => {
        it('should validate legitimate phone numbers', () => {
            const validPhones = [
                '+1234567890',
                '(555) 123-4567',
                '+44 20 7946 0958',
                '555-123-4567',
                '1234567890'
            ]

            validPhones.forEach(phone => {
                expect(validatePhone(phone)).toBe(true)
            })
        })

        it('should reject invalid phone numbers', () => {
            const invalidPhones = [
                '123',
                'abc123',
                '++1234567890',
                '123456789012345678',
                ''
            ]

            invalidPhones.forEach(phone => {
                expect(validatePhone(phone)).toBe(false)
            })
        })

        it('should reject malicious phone patterns', () => {
            const maliciousPhones = [
                '+1234567890<script>alert("XSS")</script>',
                'javascript:alert("XSS")',
                '+1234567890 onload=alert("XSS")',
                '<img src=x onerror=alert(1)>+1234567890'
            ]

            maliciousPhones.forEach(phone => {
                expect(validatePhone(phone)).toBe(false)
            })
        })

        it('should handle non-string inputs', () => {
            expect(validatePhone(null)).toBe(false)
            expect(validatePhone(undefined)).toBe(false)
            expect(validatePhone(123)).toBe(false)
            expect(validatePhone({})).toBe(false)
        })
    })

    describe('validateRequired', () => {
        it('should validate non-empty values', () => {
            expect(validateRequired('Valid input')).toBe(true)
            expect(validateRequired('  Valid input  ')).toBe(true)
            expect(validateRequired(123)).toBe(true)
            expect(validateRequired(0)).toBe(false) // 0 is falsy
        })

        it('should reject empty values', () => {
            expect(validateRequired('')).toBe(false)
            expect(validateRequired('   ')).toBe(false)
            expect(validateRequired(null)).toBe(false)
            expect(validateRequired(undefined)).toBe(false)
        })

        it('should reject inputs that become empty after sanitization', () => {
            const maliciousInputs = [
                '<script></script>',
                'javascript:',
                '<>'
            ]

            maliciousInputs.forEach(input => {
                expect(validateRequired(input)).toBe(false)
            })
        })
    })

    describe('validateMinLength', () => {
        it('should validate minimum length', () => {
            expect(validateMinLength('hello', 3)).toBe(true)
            expect(validateMinLength('hello', 5)).toBe(true)
            expect(validateMinLength('hi', 3)).toBe(false)
            expect(validateMinLength(12345, 3)).toBe(true)
        })

        it('should handle empty values', () => {
            expect(validateMinLength('', 3)).toBe(false)
            expect(validateMinLength(null, 3)).toBe(false)
        })
    })

    describe('validateMaxLength', () => {
        it('should validate maximum length', () => {
            expect(validateMaxLength('hello', 10)).toBe(true)
            expect(validateMaxLength('hello', 5)).toBe(true)
            expect(validateMaxLength('hello world', 5)).toBe(false)
            expect(validateMaxLength(12345, 3)).toBe(false)
        })

        it('should handle empty values', () => {
            expect(validateMaxLength('', 3)).toBe(true)
            expect(validateMaxLength(null, 3)).toBe(true)
        })
    })

    describe('validateFileType', () => {
        it('should validate legitimate file types', () => {
            const validFiles = [
                { name: 'data.csv', type: 'text/csv' },
                { name: 'spreadsheet.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
                { name: 'legacy.xls', type: 'application/vnd.ms-excel' }
            ]

            validFiles.forEach(file => {
                expect(validateFileType(file)).toBe(true)
            })
        })

        it('should reject invalid file types', () => {
            const invalidFiles = [
                { name: 'malware.exe', type: 'application/x-executable' },
                { name: 'script.js', type: 'application/javascript' },
                { name: 'image.jpg', type: 'image/jpeg' },
                { name: 'document.pdf', type: 'application/pdf' }
            ]

            invalidFiles.forEach(file => {
                expect(validateFileType(file)).toBe(false)
            })
        })

        it('should handle missing file properties', () => {
            const invalidFiles = [
                null,
                undefined,
                {},
                { name: 'test.csv' }, // Missing type
                { type: 'text/csv' } // Missing name
            ]

            invalidFiles.forEach(file => {
                expect(validateFileType(file)).toBe(false)
            })
        })

        it('should sanitize malicious filenames', () => {
            const maliciousFile = {
                name: '../../../malicious<script>alert("XSS")</script>.csv',
                type: 'text/csv'
            }

            // Should still validate the file type correctly after sanitization
            expect(validateFileType(maliciousFile)).toBe(true)
        })
    })

    describe('validateCSVStructure', () => {
        it('should validate correct CSV structure', () => {
            const csvText = 'FirstName,Phone,Notes\nJohn,1234567890,Test note'
            const result = validateCSVStructure(csvText, ['FirstName', 'Phone', 'Notes'])

            expect(result.isValid).toBe(true)
            expect(result.headers).toEqual(['FirstName', 'Phone', 'Notes'])
            expect(result.totalRows).toBe(1)
        })

        it('should detect missing columns', () => {
            const csvText = 'Name,Phone\nJohn,1234567890'
            const result = validateCSVStructure(csvText, ['FirstName', 'Phone', 'Notes'])

            expect(result.isValid).toBe(false)
            expect(result.error).toContain('Missing required columns')
        })

        it('should handle empty CSV', () => {
            const result = validateCSVStructure('', ['FirstName'])

            expect(result.isValid).toBe(false)
            expect(result.error).toBe('File appears to be empty')
        })

        it('should handle malformed CSV gracefully', () => {
            const csvText = 'Invalid CSV content that cannot be parsed properly'
            const result = validateCSVStructure(csvText, ['FirstName'])

            expect(result.isValid).toBe(false)
            expect(result.error).toContain('Missing required columns')
        })
    })

    describe('validateFileSize', () => {
        it('should validate file size within limit', () => {
            const file = { size: 1024 * 1024 } // 1MB
            expect(validateFileSize(file, 2)).toBe(true) // 2MB limit
        })

        it('should reject file size over limit', () => {
            const file = { size: 3 * 1024 * 1024 } // 3MB
            expect(validateFileSize(file, 2)).toBe(false) // 2MB limit
        })

        it('should handle exact size limit', () => {
            const file = { size: 2 * 1024 * 1024 } // 2MB
            expect(validateFileSize(file, 2)).toBe(true) // 2MB limit
        })
    })

    describe('validatePasswordStrength', () => {
        it('should validate strong passwords', () => {
            const strongPasswords = [
                'SecurePass123!',
                'MyStr0ng@Password',
                'C0mpl3x#P@ssw0rd'
            ]

            strongPasswords.forEach(password => {
                expect(validatePasswordStrength(password)).toBe(true)
            })
        })

        it('should reject weak passwords', () => {
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
            ]

            weakPasswords.forEach(password => {
                expect(validatePasswordStrength(password)).toBe(false)
            })
        })

        it('should handle non-string inputs', () => {
            expect(validatePasswordStrength(null)).toBe(false)
            expect(validatePasswordStrength(undefined)).toBe(false)
            expect(validatePasswordStrength(123)).toBe(false)
        })
    })

    describe('getPasswordStrength', () => {
        it('should provide detailed password strength feedback', () => {
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
            ]

            testCases.forEach(({ password, expectedScore, expectedFeedback }) => {
                const result = getPasswordStrength(password)
                expect(result.score).toBe(expectedScore)
                expect(result.feedback).toBe(expectedFeedback)
            })
        })

        it('should calculate correct strength levels', () => {
            const testCases = [
                { password: 'a', expectedStrength: 'Very Weak' },
                { password: 'aB', expectedStrength: 'Weak' },
                { password: 'aB1', expectedStrength: 'Fair' },
                { password: 'aB1!', expectedStrength: 'Good' },
                { password: 'aB1!cdef', expectedStrength: 'Strong' }
            ]

            testCases.forEach(({ password, expectedStrength }) => {
                const result = getPasswordStrength(password)
                expect(result.strength).toBe(expectedStrength)
            })
        })
    })

    describe('createValidator', () => {
        it('should create validator function', () => {
            const rules = {
                email: [required(), email()],
                password: [required(), minLength(6)]
            }

            const validator = createValidator(rules)
            expect(typeof validator).toBe('function')
        })

        it('should validate form values', () => {
            const rules = {
                email: [required(), email()],
                password: [required(), minLength(6)]
            }

            const validator = createValidator(rules)

            const validValues = {
                email: 'test@example.com',
                password: 'password123'
            }

            const invalidValues = {
                email: 'invalid-email',
                password: '123'
            }

            expect(Object.keys(validator(validValues))).toHaveLength(0)
            expect(Object.keys(validator(invalidValues))).toHaveLength(2)
        })
    })

    describe('Validation Rules', () => {
        describe('required', () => {
            it('should create required validator', () => {
                const validator = required('Custom message')

                expect(validator('value')).toBeNull()
                expect(validator('')).toBe('Custom message')
                expect(validator(null)).toBe('Custom message')
            })
        })

        describe('email', () => {
            it('should create email validator', () => {
                const validator = email('Custom email message')

                expect(validator('test@example.com')).toBeNull()
                expect(validator('invalid-email')).toBe('Custom email message')
                expect(validator('')).toBeNull() // Empty is valid (use required for mandatory)
            })
        })

        describe('minLength', () => {
            it('should create minLength validator', () => {
                const validator = minLength(5, 'Custom min message')

                expect(validator('hello')).toBeNull()
                expect(validator('hi')).toBe('Custom min message')
                expect(validator('')).toBeNull() // Empty is valid
            })
        })

        describe('maxLength', () => {
            it('should create maxLength validator', () => {
                const validator = maxLength(5, 'Custom max message')

                expect(validator('hello')).toBeNull()
                expect(validator('hello world')).toBe('Custom max message')
                expect(validator('')).toBeNull()
            })
        })

        describe('strongPassword', () => {
            it('should create strong password validator', () => {
                const validator = strongPassword('Custom password message')

                expect(validator('SecurePass123!')).toBeNull()
                expect(validator('weak')).toBe('Custom password message')
                expect(validator('')).toBeNull() // Empty is valid
            })
        })

        describe('phoneNumber', () => {
            it('should create phone number validator', () => {
                const validator = phoneNumber('Custom phone message')

                expect(validator('+1234567890')).toBeNull()
                expect(validator('invalid')).toBe('Custom phone message')
                expect(validator('')).toBeNull() // Empty is valid
            })
        })
    })
})