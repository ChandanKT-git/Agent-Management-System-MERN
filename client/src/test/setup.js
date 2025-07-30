import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = (() => {
    let store = {}
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString()
        }),
        removeItem: vi.fn((key) => {
            delete store[key]
        }),
        clear: vi.fn(() => {
            store = {}
        }),
    }
})()
global.localStorage = localStorageMock

// Mock window.location properly for React Router
delete window.location
window.location = {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
}

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
}