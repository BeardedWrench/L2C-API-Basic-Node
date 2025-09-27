# Basic Node API - Complete Setup Guide

## Prerequisites

- **[Node.js 18+ installation](./guides/node-install.md)**
- **[Git installed](./guides/git-install.md)**
- A code editor ([VS Code recommended](https://code.visualstudio.com/))
- **[Docker and Docker Compose](https://www.docker.com/get-started/)**

## Step 1: Intialize Node Project

```
npm init -y

# Install typescript and dev dependencies
npm install -D typescript @types/node @types/express @types/pg nodemon ts-node eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Install production dependencies
npm install express pg dotenv express-rate-limit
```

## Step 2: Create Typescript configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "moduleResolution": "node",
    "resovleJsonModule": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## Step 3: Update package.json Scripts

Update the `scripts` setion in `package.json`

```json
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
```
