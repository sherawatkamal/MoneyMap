# MoneyMap Monorepo

This repo is structured as a simple two-package workspace:

- `client/`: Vite + React TypeScript frontend (moved from original root)
- `server/`: Flask Python backend with a basic `/api/health` route

## Development

Open two terminals:

```bash
# Client
cd client
npm install
npm run dev

# Server
cd ../server
pip install -r requirements.txt
python app.py
```

Client dev server is typically on `http://localhost:5173`, server on `http://localhost:5000`.

## Requirements

- Node.js for the frontend
- Python 3.7+ for the backend
- pip for Python package management
