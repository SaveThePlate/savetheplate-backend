#!/bin/bash

# Test script for /users/set-role endpoint
# Usage: ./test-set-role.sh <token> <role>

TOKEN=${1:-""}
ROLE=${2:-"CLIENT"}
BACKEND_URL=${BACKEND_URL:-"https://leftover-be.ccdev.space"}

if [ -z "$TOKEN" ]; then
    echo "❌ Error: Token is required"
    echo "Usage: ./test-set-role.sh <token> <role>"
    echo "Example: ./test-set-role.sh 'your-jwt-token' CLIENT"
    exit 1
fi

echo "🧪 Testing /users/set-role endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backend URL: $BACKEND_URL"
echo "Role: $ROLE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test the endpoint
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$BACKEND_URL/users/set-role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"role\": \"$ROLE\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Success! Role set successfully"
    exit 0
else
    echo "❌ Error: Request failed with status $HTTP_CODE"
    exit 1
fi
