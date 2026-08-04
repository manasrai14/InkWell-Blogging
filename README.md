# Inkwell — a multi-user blogging platform

A full-stack blogging platform: sign up, write posts in Markdown, follow other
writers' profiles, like and comment on posts. Built for running locally.

- **Backend:** Node.js + Express + SQLite (via `better-sqlite3`), JWT auth
- **Frontend:** React + Vite, React Router, Markdown rendering via `marked`
- **Design:** a custom "literary journal" look — no UI library, just
  hand-styled CSS with a warm ink/paper/oxblood/gold palette

No external services or accounts are required — everything runs on your
machine and data is stored in a local SQLite file.

## Prerequisites

- [Node.js](https://nodejs.org) 18 or later (includes npm)

## 1. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
# open .env and set JWT_SECRET to any long random string
npm run dev
```

The API starts on **http://localhost:4000**. A `inkwell.db` SQLite file is
created automatically on first run — no separate database install needed.

## 2. Set up the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app starts on **http://localhost:5173** and proxies `/api` requests to
the backend. Open that URL in your browser.

## Using it

1. Click **Join** to create an account.
2. Click **Write** to publish your first post (Markdown supported — try
   `# heading`, `**bold**`, `> quote`, or a list).
3. Visit `/@yourusername` to see your public profile and published posts.
4. Like and comment on posts as other users to try the social features.

## Project structure

```
blog-platform/
├── backend/
│   ├── server.js          # Express app + route mounting
│   ├── db.js               # SQLite connection + schema
│   ├── middleware/auth.js  # JWT verification
│   └── routes/
│       ├── auth.js         # register / login / me
│       ├── posts.js        # CRUD + likes
│       ├── comments.js     # comments per post
│       └── users.js        # public profiles
└── frontend/
    └── src/
        ├── api.js               # fetch wrapper for the backend
        ├── context/AuthContext.jsx
        ├── components/          # Navbar, PostCard, ProtectedRoute
        ├── pages/                # Home, Login, Register, Editor, PostPage, Profile
        └── styles/global.css     # design system
```

## Notes & next steps

- Passwords are hashed with bcrypt; tokens are signed JWTs stored in
  `localStorage` on the client (fine for local/personal use — for a public
  deployment you'd want httpOnly cookies and HTTPS).
- The feed paginates 10 posts at a time (`/api/posts?page=2`); the UI
  currently only shows page 1 — wire up a "load more" button if you want
  more.
- Drafts: saving without publishing sets `published: 0`, but there's no
  "My Drafts" view yet — add a filter on the profile page if you want one.
