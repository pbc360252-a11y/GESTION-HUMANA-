#!/bin/bash
set -e

echo "=== Instalando dependencias del backend ==="
npm install --prefix backend

echo "=== Generando cliente Prisma ==="
./backend/node_modules/.bin/prisma generate --schema=./backend/prisma/schema.prisma

echo "=== Instalando dependencias del frontend ==="
npm install --prefix frontend

echo "=== Compilando el frontend ==="
npm run build --prefix frontend

echo "=== Build completado con exito ==="
