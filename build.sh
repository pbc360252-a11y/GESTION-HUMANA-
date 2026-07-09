#!/bin/bash
set -e

echo "=== [1/3] Instalando dependencias del backend ==="
cd backend
npm install
cd ..

echo "=== [2/3] Generando cliente Prisma para Linux ==="
./backend/node_modules/.bin/prisma generate --schema=./backend/prisma/schema.prisma

echo "=== [3/3] Instalando y compilando el frontend ==="
cd frontend
npm install --include=dev
npm run build
cd ..

echo "=== Build completado con exito ==="
