# Inicializar express con typescript

```bash
mkdir mi-proyecto-express
cd mi-proyecto-express
```

```bash
npm init -y
npm install express --save
npm install -D typescript ts-node-dev @types/node @types/express
```

```bash
npx tsc --init
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "types": ["node"],

    "esModuleInterop": true,
    "skipLibCheck": true,

    "resolveJsonModule": true,
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

# Usar aliases

## For production

Install module

```bash
npm install -D -E tsc-alias
```

in package.json

```json
"scripts": {
  "build": "tsc --project tsconfig.json && tsc-alias -p tsconfig.json",
}
```

## For development

Install module

```bash
npm install -D -E tsconfig-paths
```

Use in node

```bash
node -r tsconfig-paths/register main.js
```

in package json

```json
"scripts":{
  "dev": "export NODE_ENV=development&&ts-node-dev --respawn --transpile-only -r tsconfig-paths/register src/index.ts",
}

```

# Install playwright

```bash
npm install playwright
```
