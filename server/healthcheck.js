const http = require('http');
const config = require('./config');

const options = {
    host: 'localhost',
    port: config.server.port,
    path: '/api/health',
    timeout: 2000,
    method: 'GET'
};

const request = http.request(options, (res) => {
    console.log(`Health check status: ${res.statusCode}`);
    if (res.statusCode === 200) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});

request.on('error', (err) => {
    console.error('Health check failed:', err.message);
    process.exit(1);
});

request.on('timeout', () => {
    console.error('Health check timed out');
    request.destroy();
    process.exit(1);
});

request.end();