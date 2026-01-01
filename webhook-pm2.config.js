module.exports = {
  apps: [{
    name: 'webhook-deploy',
    script: './webhook-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET, // Required - no default for security
      DOCKER_USERNAME: process.env.DOCKER_USERNAME,
      DOCKER_PASSWORD: process.env.DOCKER_PASSWORD
    }
  }]
};

