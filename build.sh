#!/bin/bash
set -e

echo "=== [1/4] Instalando dependencias del backend ==="
npm install --prefix backend

echo "=== [2/4] Generando cliente Prisma para Linux ==="
./backend/node_modules/.bin/prisma generate --schema=./backend/prisma/schema.prisma

echo "=== [3/4] Instalando dependencias del frontend ==="
npm install --include=dev --prefix frontend

echo "=== [4/4] Compilando el frontend ==="
npm run build --prefix frontend

echo "=== Build completado con exito ==="
