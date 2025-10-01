# MoneyMap Monorepo

This repo is structured as a simple two-package workspace:

- `client/`: Vite + React TypeScript frontend (moved from original root)
- `server/`: Express + TypeScript backend with a basic `/api/health` route

## Development

Open two terminals:

```bash
# Client
cd client
npm install
npm run dev

# Server
cd ../server
npm install
npm run dev
```

Client dev server is typically on `http://localhost:5173`, server on `http://localhost:5000`.

## Build

```bash
cd server && npm run build
```

Frontend build remains managed by Vite in `client/`.
