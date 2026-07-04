# GitHub Profile Analyzer API

A backend service built with **Node.js**, **Express.js**, and **MySQL** that fetches a
public GitHub user profile via the GitHub REST API, derives useful insights from it,
and persists those insights for later retrieval.

## Features

- **Analyze a profile** — fetches a GitHub user's public profile *and* their public
  repositories, then computes:
  - Public repo count, public gist count, followers, following
  - **Total stars** and **total forks** across all public repos
  - **Most used language** and **top 5 languages** by repo count
  - **Account age** in days (derived from GitHub account creation date)
  - Bio, company, location, blog, avatar, profile URL, etc.
- **Store insights in MySQL** — results are upserted, so re-analyzing a user
  refreshes their stored data instead of duplicating it.
- **List all analyzed profiles** — paginated, sortable.
- **Get a single analyzed profile** — served from MySQL (no extra GitHub call).
- **Delete a stored profile** (bonus utility endpoint).
- Centralized error handling, GitHub rate-limit detection, input validation,
  and a configurable `GITHUB_TOKEN` to raise the GitHub API rate limit from
  60/hr to 5,000/hr.

## Tech Stack

- Node.js + Express.js
- MySQL (via `mysql2`)
- Axios (GitHub REST API client)
- Jest + Supertest (tests, GitHub/DB layers mocked)

## Project Structure

```
github-profile-analyzer/
├── config/
│   └── db.js                 # MySQL connection pool
├── controllers/
│   └── profileController.js  # Route handler logic
├── db/
│   ├── schema.sql             # Database schema
│   └── migrate.js             # Script to apply schema.sql
├── middleware/
│   └── errorHandler.js
├── routes/
│   └── profileRoutes.js
├── services/
│   ├── githubService.js      # GitHub API integration + insight derivation
│   └── profileModel.js       # All SQL queries (data access layer)
├── tests/
│   └── profile.test.js
├── postman_collection.json
├── .env.example
├── server.js
└── package.json
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ (for native `fetch`/ESM support)
- A running MySQL server (local, Docker, or a managed instance like PlanetScale/RDS)

### 2. Clone & install

```bash
git clone <your-repo-url>
cd github-profile-analyzer
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=github_analyzer

# Optional but recommended — raises GitHub's rate limit from 60/hr to 5000/hr.
# Create one at https://github.com/settings/tokens (no scopes needed for public data).
GITHUB_TOKEN=

GITHUB_API_URL=https://api.github.com
```

### 4. Create the database schema

You can either let the migration script create everything:

```bash
npm run migrate
```

...or run `db/schema.sql` manually against your MySQL instance:

```bash
mysql -u root -p < db/schema.sql
```

### 5. Run the server

```bash
npm run dev     # with nodemon, auto-restart on changes
# or
npm start
```

The API will be available at `http://localhost:5000`.

### 6. Run tests

```bash
npm test
```

Tests mock the GitHub API and the MySQL layer, so they run without a real
database connection or network access.

## API Reference

Base path: `/api/profiles`

| Method | Endpoint                       | Description                                              |
|--------|---------------------------------|-----------------------------------------------------------|
| POST   | `/api/profiles/:username/analyze` | Fetches `:username` from GitHub, computes insights, stores/updates in MySQL |
| GET    | `/api/profiles`                 | Returns all stored analyzed profiles (supports `?limit=&offset=&sortBy=&order=`) |
| GET    | `/api/profiles/:username`       | Returns a single stored profile from MySQL                |
| DELETE | `/api/profiles/:username`       | Deletes a stored profile                                   |

### Example: Analyze a profile

```bash
curl -X POST http://localhost:5000/api/profiles/torvalds/analyze
```

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "torvalds",
    "name": "Linus Torvalds",
    "public_repos": 8,
    "followers": 220000,
    "following": 0,
    "total_stars": 15000,
    "total_forks": 3000,
    "most_used_language": "C",
    "top_languages": [{ "language": "C", "count": 5 }],
    "account_age_days": 5300,
    "last_analyzed_at": "2026-07-04 12:00:00"
  }
}
```

### Example: List all profiles

```bash
curl "http://localhost:5000/api/profiles?limit=10&sortBy=followers&order=DESC"
```

### Example: Get a single profile

```bash
curl http://localhost:5000/api/profiles/torvalds
```

## Postman Collection

Import `postman_collection.json` into Postman. It includes requests for every
endpoint with a `{{baseUrl}}` variable (defaults to `http://localhost:5000`).

## Deployment Notes

- Any Node-friendly host works (Railway, Render, Fly.io, an EC2/VM, etc.).
- Provision a MySQL instance (PlanetScale, RDS, Railway MySQL, or a VM) and
  point the `DB_*` env vars at it.
- Run `npm run migrate` once against the production database before starting
  the server, or run `db/schema.sql` manually.
- Set `GITHUB_TOKEN` in production to avoid hitting GitHub's unauthenticated
  rate limit (60 requests/hour is easy to exhaust).

## Design Notes / Improvements Made Beyond the Base Requirements

- **Upsert instead of insert**: re-analyzing the same username updates the
  existing row (`last_analyzed_at` refreshes) rather than creating duplicates.
- **Derived insights beyond the basics**: total stars, total forks, most-used
  language, top 5 languages, and account age in days — computed from the
  user's public repositories, not just the raw profile payload.
- **Pagination & sorting** on the list endpoint (`limit`, `offset`, `sortBy`, `order`).
  Sort columns are allow-listed to prevent SQL injection via `sortBy`.
- **Input validation** on the username param before any GitHub/DB call.
- **GitHub rate-limit awareness**: a 403 from GitHub is translated into a
  clear 429 response instructing the caller to configure `GITHUB_TOKEN`.
- **Delete endpoint** as a small bonus utility for managing stored data.
