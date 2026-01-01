#!/bin/bash
# Quick deployment verification script
# Run this on your server after rebuilding

CONTAINER_NAME="savetheplate-backend"
PORT=3001

echo "🔍 Verifying deployment..."

# Check if container is running
echo "1. Checking container status..."
if docker ps | grep -q "$CONTAINER_NAME"; then
    echo "✅ Container is running"
else
    echo "❌ Container is NOT running!"
    docker ps -a | grep "$CONTAINER_NAME"
    exit 1
fi

# Check container health
echo "2. Checking container health..."
HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "no-healthcheck")
echo "   Health status: $HEALTH"

# Check recent logs for errors
echo "3. Checking recent logs for errors..."
ERRORS=$(docker logs "$CONTAINER_NAME" --tail 50 2>&1 | grep -i "error\|exception\|failed" | head -5)
if [ -z "$ERRORS" ]; then
    echo "✅ No recent errors found"
else
    echo "⚠️  Recent errors found:"
    echo "$ERRORS"
fi

# Check if port is listening
echo "4. Checking if port $PORT is listening..."
if docker exec "$CONTAINER_NAME" sh -c "nc -z localhost $PORT" 2>/dev/null; then
    echo "✅ Port $PORT is listening"
else
    echo "⚠️  Port $PORT may not be listening"
fi

# Check container uptime
echo "5. Container uptime:"
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"

# Check resource usage
echo "6. Resource usage:"
docker stats "$CONTAINER_NAME" --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "✅ Verification complete!"
echo "💡 To view full logs: docker logs $CONTAINER_NAME -f"
echo "💡 To enter container: docker exec -it $CONTAINER_NAME sh"

