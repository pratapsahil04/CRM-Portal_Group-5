# Piston.Nerd

Piston.Nerd is a lightweight CRM-style portal for vehicle/service management. It combines a Vite + React frontend with a PHP backend for authentication, ticketing, inventory and reporting.

**Status:** Working prototype (frontend + PHP backend). Core features implemented and ready for local development.

**Quick Links**
- Frontend: `src/` (React + Vite)
- Backend: `backend/` (PHP endpoints)
- Database schema: `schema.sql`, `seed.sql`

**Features**
- Authentication: user registration, technician registration, login, password reset, OTP verification
- Admin: technician management UI and backend pages
- Customers: manage customer vehicles
- Tickets / Workorders: create tickets, assign technicians, view details, messaging and status tracking
- Inventory: parts and suppliers management
- Reports: dashboard summaries and metrics
- Docker: backend contains a `Dockerfile` for containerized deployment

**Folder Structure (high level)**

- `backend/`
	- `admin/` — admin pages (e.g. `technicians.php`)
	- `auth/` — authentication endpoints (`login.php`, `register.php`, `reset_password.php`, `send_otp.php`, `verify_otp.php`, `register_technician.php`)
	- `config/` — `db.php` database connection settings
	- `customer/` — customer-facing PHP pages (`vehicles.php`)
	- `inventory/` — parts and suppliers pages (`parts.php`, `suppliers.php`)
	- `reports/` — reporting pages (`dashboard.php`)
	- `ticket/` — ticketing endpoints (`create.php`, `list.php`, `details.php`, `assign.php`, `workorder.php`, `message.php`, `status.php`)
	- `Dockerfile` — optional backend container definition

- `public/` — public assets served by the frontend (static files)
- `src/` — React frontend source
	- `assets/` — images and static assets
	- `components/` — React components (organized by feature)
	- `App.jsx`, `main.jsx` — app entry points

- Root files:
	- `index.html`, `package.json`, `vite.config.js`, `eslint.config.js`
	- `schema.sql`, `seed.sql` — DB schema and sample data

**Requirements**
- Node.js (16+ recommended) and npm/yarn for the frontend
- PHP 7.4+ and a webserver (Apache / Nginx) for the backend
- MySQL / MariaDB for database (see `schema.sql`)
- Docker (optional) to run the backend in a container

**Development: Frontend**
1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

The frontend runs on Vite and will proxy or call backend endpoints at their configured URLs.

**Development: Backend**
- Configure the database connection in `backend/config/db.php` (host, user, password, database).
- Create the database and tables using `schema.sql`, and optionally load `seed.sql`.
- Run the PHP backend via your webserver or use PHP's built-in server for quick testing:

```bash
cd backend
php -S 0.0.0.0:8000
```

Or build and run the included Dockerfile (optional):

```bash
docker build -t piston-nerd-backend backend/
docker run --rm -p 8000:8000 --env-file .env piston-nerd-backend
```

**Environment**
- Use a `.env` file (not checked into git) for sensitive settings like DB credentials and secret keys. The backend reads `backend/config/db.php` — update it to load env vars as needed.

**Database**
- `schema.sql` contains the schema for users, technicians, tickets, parts, suppliers and related tables.
- `seed.sql` provides example data for local development.

**Testing & Linting**
- Frontend: ESLint is configured; run linters via project scripts when available.

**Notes & Next steps**
- Add CORS/proxy configuration for seamless frontend-backend integration in dev.
- Add automated tests and CI workflow.
- Harden auth flows (rate limiting, stronger password policies) before production.

**Contact / Contributing**
- To contribute, fork the repo, create a feature branch, and open a PR. Please include tests for new features.

---

