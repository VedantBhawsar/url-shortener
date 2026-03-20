#!/bin/bash

set -e

echo "🚀 Starting migration to Turborepo (Bun)..."

# 1. Create monorepo structure
mkdir -p apps packages

# 2. Move existing Express app into apps/api
echo "📦 Moving Express app..."
mkdir -p apps/api
shopt -s extglob

mv !(apps|packages|bun.lockb|package.json|node_modules) apps/api/ 2>/dev/null || true

# Move package.json if exists
if [ -f package.json ]; then
  mv package.json apps/api/
fi

# Move bun lock if exists
if [ -f bun.lockb ]; then
  mv bun.lockb apps/api/
fi

# 3. Root package.json
echo "📝 Creating root package.json..."
cat > package.json <<EOF
{
  "name": "turbo-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "packageManager": "bun@latest",
  "devDependencies": {
    "turbo": "latest"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build"
  }
}
EOF

# 4. Install turbo with bun
echo "📥 Installing dependencies with bun..."
bun install

# 5. Create turbo.json
echo "⚙️ Creating turbo.json..."
cat > turbo.json <<EOF
{
  "\$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false
    }
  }
}
EOF

# 6. Fix Express app scripts
echo "🔧 Updating Express app..."
cd apps/api

# Ensure package.json exists
if [ ! -f package.json ]; then
  cat > package.json <<EOF
{
  "name": "api",
  "scripts": {
    "dev": "bun run index.js",
    "build": "echo 'No build step'"
  }
}
EOF
else
  node - <<EOF
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));

pkg.scripts = pkg.scripts || {};
pkg.scripts.dev = pkg.scripts.dev || "bun run index.js";
pkg.scripts.build = pkg.scripts.build || "echo 'No build step'";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
EOF
fi

cd ../../

# 7. Create React app with Vite
echo "⚛️ Creating React app (Vite)..."
bun create vite apps/web --template react

cd apps/web
bun install

# 8. Update React scripts
node - <<EOF
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));

pkg.scripts.dev = "vite";
pkg.scripts.build = "vite build";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
EOF

cd ../../

# 9. Final install at root
echo "📦 Final install..."
bun install

echo ""
echo "✅ Turborepo + Bun setup complete!"
echo ""
echo "Run everything:"
echo "👉 bun run dev"