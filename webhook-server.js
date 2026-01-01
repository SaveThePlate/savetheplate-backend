const http = require('http');
const { exec } = require('child_process');
const crypto = require('crypto');

const PORT = 3002;

// Security: Require environment variables - no defaults in production
if (!process.env.WEBHOOK_SECRET) {
  console.error('❌ ERROR: WEBHOOK_SECRET environment variable is required');
  process.exit(1);
}
if (!process.env.DOCKER_USERNAME) {
  console.error('❌ ERROR: DOCKER_USERNAME environment variable is required');
  process.exit(1);
}

const SECRET_TOKEN = process.env.WEBHOOK_SECRET;
const DOCKER_USERNAME = process.env.DOCKER_USERNAME;

// Script de déploiement backend
const deployBackend = () => {
  return new Promise((resolve, reject) => {
    if (!process.env.DOCKER_PASSWORD) {
      reject(new Error('DOCKER_PASSWORD environment variable is required'));
      return;
    }
    const dockerPassword = process.env.DOCKER_PASSWORD;
    const script = `
      set -e
      echo "🐳 Pulling latest Docker image from Docker Hub..."
      echo "${dockerPassword}" | sudo docker login -u "${DOCKER_USERNAME}" --password-stdin
      sudo docker pull ${DOCKER_USERNAME}/savetheplate-backend:latest
      
      echo "🛑 Stopping old container..."
      sudo docker stop savetheplate-backend 2>/dev/null || true
      sudo docker rm savetheplate-backend 2>/dev/null || true
      
      echo "🔧 Creating directories..."
      mkdir -p /var/www/save-the-plate/backend/store
      mkdir -p /var/www/save-the-plate/backend/uploads
      
      echo "🚀 Starting new container..."
      sudo docker run -d \
        --name savetheplate-backend \
        --restart unless-stopped \
        -p 3001:3001 \
        -v /var/www/save-the-plate/backend/store:/usr/src/app/store \
        -v /var/www/save-the-plate/backend/uploads:/usr/src/app/uploads \
        -v /var/www/save-the-plate/backend/.env:/usr/src/app/.env:ro \
        --env-file /var/www/save-the-plate/backend/.env \
        ${DOCKER_USERNAME}/savetheplate-backend:latest
      
      echo "🧹 Cleaning up old images..."
      sudo docker image prune -f
      
      echo "✅ Backend deployment complete!"
      sudo docker ps | grep savetheplate-backend || echo "⚠️  Container may not be running"
    `;
    
    exec(script, (error, stdout, stderr) => {
      if (error) {
        console.error(`Deployment error: ${error}`);
        reject(error);
        return;
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
      resolve(stdout);
    });
  });
};

// Script de déploiement frontend
const deployFrontend = () => {
  return new Promise((resolve, reject) => {
    if (!process.env.DOCKER_PASSWORD) {
      reject(new Error('DOCKER_PASSWORD environment variable is required'));
      return;
    }
    const dockerPassword = process.env.DOCKER_PASSWORD;
    const script = `
      set -e
      echo "🐳 Pulling latest Docker image from Docker Hub..."
      echo "${dockerPassword}" | sudo docker login -u "${DOCKER_USERNAME}" --password-stdin
      sudo docker pull ${DOCKER_USERNAME}/savetheplate-frontend:latest
      
      echo "🛑 Stopping old container..."
      sudo docker stop savetheplate-frontend 2>/dev/null || true
      sudo docker rm savetheplate-frontend 2>/dev/null || true
      
      echo "🚀 Starting new container..."
      sudo docker run -d \
        --name savetheplate-frontend \
        --restart unless-stopped \
        -p 3000:3000 \
        ${DOCKER_USERNAME}/savetheplate-frontend:latest
      
      echo "🧹 Cleaning up old images..."
      sudo docker image prune -f
      
      echo "✅ Frontend deployment complete!"
      sudo docker ps | grep savetheplate-frontend || echo "⚠️  Container may not be running"
    `;
    
    exec(script, (error, stdout, stderr) => {
      if (error) {
        console.error(`Deployment error: ${error}`);
        reject(error);
        return;
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
      resolve(stdout);
    });
  });
};

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const token = req.headers['x-webhook-token'] || data.token;

      // Vérifier le token
      if (token !== SECRET_TOKEN) {
        console.error('Unauthorized webhook attempt');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      const service = data.service || req.url.split('/').pop();

      console.log(`Webhook received for: ${service}`);

      let deployPromise;
      if (service === 'backend' || service === 'savetheplate-backend') {
        deployPromise = deployBackend();
      } else if (service === 'frontend' || service === 'savetheplate-frontend') {
        deployPromise = deployFrontend();
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid service. Use "backend" or "frontend"' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Deployment started', service }));

      deployPromise
        .then(() => {
          console.log(`✅ Deployment completed for ${service}`);
        })
        .catch(error => {
          console.error(`❌ Deployment failed for ${service}:`, error);
        });

    } catch (error) {
      console.error('Error processing webhook:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request' }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Webhook server listening on port ${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   POST http://localhost:${PORT}/backend`);
  console.log(`   POST http://localhost:${PORT}/frontend`);
});

