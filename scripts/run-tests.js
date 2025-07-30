#!/usr/bin/env node

/**
 * Comprehensive test runner script
 * Runs all tests with coverage reporting and generates consolidated reports
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
    console.log(`${color}${message}${colors.reset}`);
};

const runCommand = (command, args, cwd, description) => {
    return new Promise((resolve, reject) => {
        log(`\n${colors.cyan}Running: ${description}${colors.reset}`);
        log(`${colors.yellow}Command: ${command} ${args.join(' ')}${colors.reset}`);

        const child = spawn(command, args, {
            cwd,
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            if (code === 0) {
                log(`${colors.green}✓ ${description} completed successfully${colors.reset}`);
                resolve(code);
            } else {
                log(`${colors.red}✗ ${description} failed with code ${code}${colors.reset}`);
                reject(new Error(`${description} failed`));
            }
        });

        child.on('error', (error) => {
            log(`${colors.red}✗ ${description} error: ${error.message}${colors.reset}`);
            reject(error);
        });
    });
};

const checkCoverage = (coverageFile, threshold = 80) => {
    try {
        if (!fs.existsSync(coverageFile)) {
            log(`${colors.yellow}Warning: Coverage file not found: ${coverageFile}${colors.reset}`);
            return false;
        }

        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        const total = coverage.total;

        const metrics = ['lines', 'functions', 'branches', 'statements'];
        let passed = true;

        log(`\n${colors.cyan}Coverage Report:${colors.reset}`);
        metrics.forEach(metric => {
            const pct = total[metric].pct;
            const color = pct >= threshold ? colors.green : colors.red;
            log(`  ${metric}: ${color}${pct}%${colors.reset} (threshold: ${threshold}%)`);
            if (pct < threshold) passed = false;
        });

        return passed;
    } catch (error) {
        log(`${colors.red}Error reading coverage: ${error.message}${colors.reset}`);
        return false;
    }
};

const generateConsolidatedReport = () => {
    const serverCoverageFile = path.join(__dirname, '../server/coverage/coverage-summary.json');
    const clientCoverageFile = path.join(__dirname, '../client/coverage/coverage-summary.json');

    let serverCoverage = null;
    let clientCoverage = null;

    try {
        if (fs.existsSync(serverCoverageFile)) {
            serverCoverage = JSON.parse(fs.readFileSync(serverCoverageFile, 'utf8'));
        }
        if (fs.existsSync(clientCoverageFile)) {
            clientCoverage = JSON.parse(fs.readFileSync(clientCoverageFile, 'utf8'));
        }

        log(`\n${colors.bright}${colors.cyan}=== CONSOLIDATED TEST REPORT ===${colors.reset}`);

        if (serverCoverage) {
            log(`\n${colors.magenta}Server Coverage:${colors.reset}`);
            const serverTotal = serverCoverage.total;
            log(`  Lines: ${serverTotal.lines.pct}%`);
            log(`  Functions: ${serverTotal.functions.pct}%`);
            log(`  Branches: ${serverTotal.branches.pct}%`);
            log(`  Statements: ${serverTotal.statements.pct}%`);
        }

        if (clientCoverage) {
            log(`\n${colors.magenta}Client Coverage:${colors.reset}`);
            const clientTotal = clientCoverage.total;
            log(`  Lines: ${clientTotal.lines.pct}%`);
            log(`  Functions: ${clientTotal.functions.pct}%`);
            log(`  Branches: ${clientTotal.branches.pct}%`);
            log(`  Statements: ${clientTotal.statements.pct}%`);
        }

        // Calculate overall coverage
        if (serverCoverage && clientCoverage) {
            const serverTotal = serverCoverage.total;
            const clientTotal = clientCoverage.total;

            const overallLines = Math.round((serverTotal.lines.pct + clientTotal.lines.pct) / 2);
            const overallFunctions = Math.round((serverTotal.functions.pct + clientTotal.functions.pct) / 2);
            const overallBranches = Math.round((serverTotal.branches.pct + clientTotal.branches.pct) / 2);
            const overallStatements = Math.round((serverTotal.statements.pct + clientTotal.statements.pct) / 2);

            log(`\n${colors.bright}${colors.green}Overall Coverage:${colors.reset}`);
            log(`  Lines: ${overallLines}%`);
            log(`  Functions: ${overallFunctions}%`);
            log(`  Branches: ${overallBranches}%`);
            log(`  Statements: ${overallStatements}%`);

            const overallPassed = overallLines >= 80 && overallFunctions >= 80 &&
                overallBranches >= 80 && overallStatements >= 80;

            if (overallPassed) {
                log(`\n${colors.bright}${colors.green}✓ Overall coverage meets 80% threshold${colors.reset}`);
            } else {
                log(`\n${colors.bright}${colors.red}✗ Overall coverage below 80% threshold${colors.reset}`);
            }

            return overallPassed;
        }
    } catch (error) {
        log(`${colors.red}Error generating consolidated report: ${error.message}${colors.reset}`);
    }

    return true;
};

const main = async () => {
    const startTime = Date.now();

    log(`${colors.bright}${colors.cyan}Starting Comprehensive Test Suite${colors.reset}`);
    log(`${colors.yellow}Timestamp: ${new Date().toISOString()}${colors.reset}`);

    try {
        // Run server tests with coverage
        await runCommand(
            'npm',
            ['test', '--', '--coverage', '--verbose'],
            path.join(__dirname, '../server'),
            'Server Tests with Coverage'
        );

        // Run client tests with coverage
        await runCommand(
            'npm',
            ['run', 'test:coverage'],
            path.join(__dirname, '../client'),
            'Client Tests with Coverage'
        );

        // Check individual coverage
        const serverCoveragePassed = checkCoverage(
            path.join(__dirname, '../server/coverage/coverage-summary.json')
        );

        const clientCoveragePassed = checkCoverage(
            path.join(__dirname, '../client/coverage/coverage-summary.json')
        );

        // Generate consolidated report
        const overallPassed = generateConsolidatedReport();

        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);

        log(`\n${colors.bright}${colors.cyan}=== TEST SUITE SUMMARY ===${colors.reset}`);
        log(`Duration: ${duration} seconds`);

        if (serverCoveragePassed && clientCoveragePassed && overallPassed) {
            log(`${colors.bright}${colors.green}✓ All tests passed with adequate coverage${colors.reset}`);
            process.exit(0);
        } else {
            log(`${colors.bright}${colors.red}✗ Some tests failed or coverage is below threshold${colors.reset}`);
            process.exit(1);
        }

    } catch (error) {
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);

        log(`\n${colors.bright}${colors.red}=== TEST SUITE FAILED ===${colors.reset}`);
        log(`Duration: ${duration} seconds`);
        log(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Handle process termination
process.on('SIGINT', () => {
    log(`\n${colors.yellow}Test suite interrupted${colors.reset}`);
    process.exit(1);
});

process.on('SIGTERM', () => {
    log(`\n${colors.yellow}Test suite terminated${colors.reset}`);
    process.exit(1);
});

// Run the main function
main().catch(error => {
    log(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
    process.exit(1);
});