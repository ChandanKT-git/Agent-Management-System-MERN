import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'text-summary', 'lcov', 'html', 'json'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.test.{js,jsx}',
                '**/*.spec.{js,jsx}',
                'src/main.jsx',
                'vite.config.js',
                'vitest.config.js'
            ],
            include: [
                'src/**/*.{js,jsx}'
            ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80
                },
                // Specific thresholds for critical modules
                'src/components/': {
                    branches: 85,
                    functions: 90,
                    lines: 85,
                    statements: 85
                },
                'src/utils/': {
                    branches: 90,
                    functions: 95,
                    lines: 90,
                    statements: 90
                },
                'src/services/': {
                    branches: 85,
                    functions: 90,
                    lines: 85,
                    statements: 85
                },
                'src/contexts/': {
                    branches: 85,
                    functions: 90,
                    lines: 85,
                    statements: 85
                }
            }
        }
    }
})