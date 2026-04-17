# IPY FC Website (Final Year Project)

This project is a final-year web development assignment for **IPY FC**. It is a full-stack football club website with public pages (fixtures, news, media, team, fan hub, shop) and backend-powered features such as user registration, login, authentication, cart/checkout, and admin-related content management.

---

## Project Structure

- **Frontend (static pages):** root folder (`index.html`, `shop.html`, `news.html`, etc.)
- **Backend API:** `server/` (Node.js + Express + MongoDB)

---

## Prerequisites

Install these before running the project:

1. **Git** (to clone/download code)
2. **Node.js (LTS recommended)** and **npm**
3. **MongoDB connection** (local MongoDB or MongoDB Atlas)
4. **VS Code** + optional **Live Server extension**

---

## Setup Guide (From Scratch)

### 1) Download the project

Option A — clone with Git:

```bash
git clone <YOUR_REPOSITORY_URL>
cd FYP
```

Option B — download ZIP from GitHub, extract it, then open the extracted `FYP` folder.

---

### 2) Install backend dependencies

From the project root:

```bash
cd server
npm install
```

---

### 3) Create backend environment variables (`.env`)
Create a file at:

```text
server/.env
```

Add at least:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret
PORT=5000
CORS_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
CLIENT_URL=http://127.0.0.1:5500
```

If you want to test Stripe checkout/webhooks, also add:

```env
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

---

### 4) Start the backend server

In `server/`:

```bash
npm run dev
```

or

```bash
npm start
```

The API should run on:

- `http://localhost:5000` (or your `PORT` value)

---

### 5) Run/open the frontend

From the project root (`FYP/`):

- Open the folder in VS Code.
- Open `index.html` using **Live Server** (recommended), or open the file directly in your browser.

Typical Live Server URL:

- `http://127.0.0.1:5500`

## Useful Backend Scripts

Run from `server/`:

```bash
npm run dev        # Start backend with nodemon
npm start          # Start backend normally
npm test           # Run backend tests
```

---

## Important Notes

- 
- If cloning to a new machine from GitHub, you must recreate `server/.env` manually.
- If auth fails, first verify `MONGO_URI` and `JWT_SECRET` are set correctly.