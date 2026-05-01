module.exports = {
  apps: [
    {
      name: "glamo-nepal-backend",
      script: "dist/server.js",
      instances: 2,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};