const {
    generateToken,
    verifyToken,
    hashPassword,
    comparePassword,
    extractTokenFromHeader
} = require('../utils/auth');

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
    jest.resetModules();
    process.env = {
        ...originalEnv,
        JWT_SECRET: 'test-secret-key',
        JWT_EXPIRES_IN: '1h'
    };
});

afterEach(() => {
    process.env = originalEnv;
});

describe('Auth Utils', () => {
    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const payload = { userId: '123', email: 'test@example.com', role: 'admin' };
            const token = generateToken(payload);

            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should throw error if JWT_SECRET is not set', () => {
            delete process.env.JWT_SECRET;

            const payload = { userId: '123' };

            expect(() => generateToken(payload)).toThrow('JWT_SECRET environment variable is required');
        });

        it('should use default expiration if JWT_EXPIRES_IN is not set', () => {
            delete process.env.JWT_EXPIRES_IN;

            const payload = { userId: '123' };
            const token = generateToken(payload);

            expect(typeof token).toBe('string');
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token', () => {
            const payload = { userId: '123', email: 'test@example.com', role: 'admin' };
            const token = generateToken(payload);

            const decoded = verifyToken(token);

            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.email).toBe(payload.email);
            expect(decoded.role).toBe(payload.role);
            expect(decoded.iss).toBe('agent-management-system');
        });

        it('should throw error for invalid token', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => verifyToken(invalidToken)).toThrow('Invalid token');
        });

        it('should throw error for expired token', () => {
            // Create token with very short expiration
            process.env.JWT_EXPIRES_IN = '1ms';
            const payload = { userId: '123' };
            const token = generateToken(payload);

            // Wait for token to expire
            return new Promise((resolve) => {
                setTimeout(() => {
                    expect(() => verifyToken(token)).toThrow('Token has expired');
                    resolve();
                }, 10);
            });
        });

        it('should throw error if JWT_SECRET is not set', () => {
            const payload = { userId: '123' };
            const token = generateToken(payload);

            delete process.env.JWT_SECRET;

            expect(() => verifyToken(token)).toThrow('JWT_SECRET environment variable is required');
        });
    });

    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'testpassword123';
            const hash = await hashPassword(password);

            expect(typeof hash).toBe('string');
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
        });

        it('should generate different hashes for same password', async () => {
            const password = 'testpassword123';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching password and hash', async () => {
            const password = 'testpassword123';
            const hash = await hashPassword(password);

            const isMatch = await comparePassword(password, hash);

            expect(isMatch).toBe(true);
        });

        it('should return false for non-matching password and hash', async () => {
            const password = 'testpassword123';
            const wrongPassword = 'wrongpassword';
            const hash = await hashPassword(password);

            const isMatch = await comparePassword(wrongPassword, hash);

            expect(isMatch).toBe(false);
        });

        it('should handle invalid hash gracefully', async () => {
            const password = 'testpassword123';
            const invalidHash = 'invalid-hash';

            // bcrypt.compare returns false for invalid hash instead of throwing
            const isMatch = await comparePassword(password, invalidHash);
            expect(isMatch).toBe(false);
        });
    });

    describe('extractTokenFromHeader', () => {
        it('should extract token from valid Bearer header', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
            const authHeader = `Bearer ${token}`;

            const extractedToken = extractTokenFromHeader(authHeader);

            expect(extractedToken).toBe(token);
        });

        it('should return null for missing header', () => {
            const extractedToken = extractTokenFromHeader(null);

            expect(extractedToken).toBeNull();
        });

        it('should return null for undefined header', () => {
            const extractedToken = extractTokenFromHeader(undefined);

            expect(extractedToken).toBeNull();
        });

        it('should return null for invalid format (no Bearer)', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
            const authHeader = token; // Missing "Bearer "

            const extractedToken = extractTokenFromHeader(authHeader);

            expect(extractedToken).toBeNull();
        });

        it('should return null for invalid format (wrong prefix)', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
            const authHeader = `Basic ${token}`;

            const extractedToken = extractTokenFromHeader(authHeader);

            expect(extractedToken).toBeNull();
        });

        it('should return null for malformed header', () => {
            const authHeader = 'Bearer';

            const extractedToken = extractTokenFromHeader(authHeader);

            expect(extractedToken).toBeNull();
        });
    });
});