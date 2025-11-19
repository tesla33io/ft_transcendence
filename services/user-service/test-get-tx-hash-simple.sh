#!/bin/bash

# Simple test script for GET /tournaments/:id/blockchain-tx-hash
# Usage: ./test-get-tx-hash-simple.sh <tournament_id>

API_URL="${API_URL:-http://localhost:8000}"

if [ -z "$1" ]; then
    echo "Usage: $0 <tournament_id>"
    echo "Example: $0 123"
    exit 1
fi

TOURNAMENT_ID=$1

echo "Testing GET /tournaments/$TOURNAMENT_ID/blockchain-tx-hash"
echo "=========================================="
echo

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X GET \
    "$API_URL/tournaments/$TOURNAMENT_ID/blockchain-tx-hash" \
    -H "Content-Type: application/json")

# Extract HTTP code and body
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $http_code"
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo

if [ "$http_code" = "200" ]; then
    tx_hash=$(echo "$body" | jq -r '.blockchainTxHash' 2>/dev/null)
    if [ -n "$tx_hash" ] && [ "$tx_hash" != "null" ]; then
        echo "✅ Success! Transaction Hash: $tx_hash"
    else
        echo "⚠️  Response OK but no transaction hash found"
    fi
elif [ "$http_code" = "404" ]; then
    echo "❌ Tournament not found or not finalized on blockchain"
elif [ "$http_code" = "400" ]; then
    echo "❌ Invalid tournament ID"
else
    echo "❌ Unexpected response"
fi
