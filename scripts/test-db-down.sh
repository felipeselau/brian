#!/bin/bash

echo "🛑 Stopping Brian test database..."

docker-compose -f docker-compose.test.yml down -v

echo "✅ Test database stopped and volumes removed."
