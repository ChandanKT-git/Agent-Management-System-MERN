module.exports = {
    apps: [
        {
            name: 'agent-management-server',
            script: 'server/server.js',
            cwd: './',
            instances: process.env.PM2_INSTANCES || 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'development',
                PORT: 5000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: process.env.PORT || 5000
            },
            // Logging
            log_file: './logs/pm2-combined.log',
            out_file: './logs/pm2-out.log',
            error_file: './logs/pm2-error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

            // Process management
            watch: false,
            ignore_watch: ['node_modules', 'logs', 'uploads', 'client/dist'],
            max_memory_restart: '500M',

            // Restart policy
            restart_delay: 4000,
            max_restarts: 10,
            min_uptime: '10s',

            // Health monitoring
            health_check_grace_period: 3000,
            health_check_fatal_exceptions: true,

            // Advanced features
            kill_timeout: 5000,
            listen_timeout: 3000,

            // Environment specific settings
            node_args: process.env.NODE_ENV === 'production' ? '--max-old-space-size=512' : '',

            // Graceful shutdown
            kill_retry_time: 100,

            // Source map support
            source_map_support: true,

            // Merge logs
            merge_logs: true,

            // Time zone
            time: true
        }
    ],

    deploy: {
        production: {
            user: process.env.DEPLOY_USER || 'deploy',
            host: process.env.DEPLOY_HOST || 'localhost',
            ref: 'origin/main',
            repo: process.env.DEPLOY_REPO || 'git@github.com:username/agent-management.git',
            path: process.env.DEPLOY_PATH || '/var/www/agent-management',
            'pre-deploy-local': '',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
            'pre-setup': '',
            'ssh_options': 'StrictHostKeyChecking=no'
        },
        staging: {
            user: process.env.STAGING_USER || 'deploy',
            host: process.env.STAGING_HOST || 'localhost',
            ref: 'origin/develop',
            repo: process.env.DEPLOY_REPO || 'git@github.com:username/agent-management.git',
            path: process.env.STAGING_PATH || '/var/www/agent-management-staging',
            'pre-deploy-local': '',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
            'pre-setup': '',
            'ssh_options': 'StrictHostKeyChecking=no',
            env: {
                NODE_ENV: 'staging'
            }
        }
    }
};