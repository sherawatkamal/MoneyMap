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

It is recomended that you create a virtual environment to hold the packages for this service 
to setup the virtual environment:

```bash
python3 -m venv venv
```

to enter the virtual environment:

```bash
source venv/bin/activate
```

Addionally you should creat a .env file to store sensitive data such as sql password and encryption keys. 
Finally to create your own SQL server for the service to interact with. 
To install and access:

```bash
sudo apt update
sudo apt install mysql-server
sudo service mysql start
sudo mysql -u root

CREATE DATABASE moneymap_db;
CREATE USER 'moneymap_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON moneymap_db.* TO 'moneymap_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
Ensure you set up your .env file to contain the the sql stuff
```
MYSQL_HOST=localhost
MYSQL_USER=moneymap_user
MYSQL_PASSWORD=your_password
MYSQL_DB=moneymap_db
```



Client dev server is typically on `http://localhost:5173`, server on `http://localhost:5000`.

## Requirements

- Node.js for the frontend
- Python 3.7+ for the backend
- pip for Python package management
