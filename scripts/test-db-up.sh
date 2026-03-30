#!/bin/bash

echo "🐳 Starting Brian test database..."

# Start Docker container
docker-compose -f docker-compose.test.yml up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if database is healthy
until docker exec brian-test-db pg_isready -U test -d brian_test > /dev/null 2>&1; do
  echo "   Database not ready yet, waiting..."
  sleep 2
done

echo "✅ Database is ready!"

echo "🔄 Running Prisma migrations..."
npm run db:test:migrate

echo ""
echo "✅ Test database is up and running!"
echo "   Connection: postgresql://test:test@localhost:5433/brian_test"
echo ""
echo "To stop: ./scripts/test-db-down.sh"
