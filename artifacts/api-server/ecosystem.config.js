module.exports = {
  apps: [
    {
      name: 'xpresspro-api',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '512M',
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
}
