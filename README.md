# BlueCilantro Catering Website

Multi-restaurant catering ordering site. Customers browse restaurant cards (Wonder-style), build an order from a menu, and place a catering request. The restaurant admin **and** the customer get an **email + SMS** for every order. No payment is taken online. The restaurant confirms the order and arranges payment.

**Restaurants:** Bâton Rouge · Wendel Clark's · The Lion's Den Pub · Our Festive Menu (BlueCilantro)

## Stack

| Part | Tech |
|---|---|
| Website | React 18 + Vite + React Router + Tailwind CSS (`client/`) |
| API | Node + Express 5 (`server/`) |
| Database | Prisma + PostgreSQL (Docker locally, Neon in production) |
| Email | SMTP2Go |
| SMS | Twilio |
| Pricing rules | `shared/pricing.js`, used by both the site (live totals) and the API (authoritative totals) |

## Getting started

Requires Node 20+ and Docker Desktop (for the local PostgreSQL database).

```bash
cp server/.env.example server/.env   # then set SESSION_SECRET (openssl rand -base64 32)
npm run db:up                        # starts PostgreSQL in Docker (docker-compose.yml)
npm run setup                        # installs everything, creates the tables, loads the menus
npm run dev                          # website http://localhost:5173 · API http://localhost:4000
```

Day to day: start Docker Desktop, then `npm run db:up` and `npm run dev`.

Admin panel: http://localhost:5173/admin. Sign in with `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from `server/.env` (default `admin@bluecilantro.ca` / `ChangeMe123!`). **Change this password right away** under *My Account*.

Without SMTP2Go or Twilio keys, emails and SMS are **printed in the API console** instead of being sent. That's handy for local testing.

## Turning on notifications

1. **Email:** set `SMTP2GO_API_KEY` and a verified `SMTP2GO_SENDER_EMAIL` in `server/.env`.
2. **SMS:** set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and either `TWILIO_FROM_NUMBER` (E.164, e.g. `+15875551234`) or `TWILIO_MESSAGING_SERVICE_SID`.
3. **Who gets new-order alerts:** in *Admin → Restaurants → (restaurant) → Settings → Order notifications*, set each restaurant's notification email(s) and mobile number. `OPS_NOTIFY_EMAIL` / `OPS_NOTIFY_PHONE` in `.env` are used when a restaurant has none, and `OPS_NOTIFY_EMAIL` is also copied on every order.

Every send result (success, failure, or "logged") appears on the order page in the admin, with a **Re-send** button.

## What customers get

- **Order placed:** confirmation email (full itemized order) and SMS with a tracking link.
- **Admin confirms / completes / cancels:** email and SMS update (the admin can untick "notify customer").
- `/track`: look up an order by order number + email.

## Admin panel

- **Orders:** filter by status and restaurant, search, open an order, then Confirm / Complete / Cancel, add internal notes, and see the notification log.
- **Restaurants & Menus:**
  - *Menu* tab: add, edit, hide, delete or reorder categories and items; edit prices, minimums, price options (e.g. Medium/Large) and choice groups (e.g. "Choose 3 Appetizers").
  - *Settings* tab: listing info, notification contacts, minimum guests, notice hours, tax %, gratuity %, delivery fee, terms.
- **Admin Users** (BlueCilantro admins only): create restaurant admins who can only see their own restaurant's orders and menu.

## Menu data

Menus were transcribed from `BlueCilantro-catering-menus/` into `server/prisma/menus/*.js`. `npm run db:seed` loads them. **Re-seeding replaces menus** (and any menu edits made in the admin) but keeps orders and admin users, so once you start editing menus in the admin, don't re-seed.

Pricing types: `per_person`, `per_unit` (each / dozen / hour / oz…), `per_lb`, `fixed` (platters/trays), `quote` (no price; restaurant follows up).

## Deploying to Vercel

The site is served as static files and the API runs as one serverless function (`api/index.js` → the Express app in `server/src/app.js`). `vercel.json` holds the install/build commands and routing.

1. **Database (Neon).** Create a project at https://neon.tech and copy two connection strings: the **pooled** one (host contains `-pooler`) and the **direct** one. From your computer, create the tables and load data:
   ```bash
   cd server
   export DATABASE_URL="<pooled url>" DIRECT_URL="<direct url>"
   npx prisma db push
   npm run db:migrate-sqlite        # copy existing local data (prisma/dev.db), or:
   npm run db:seed                  # start fresh with the menus + super admin
   ```
   To copy your current *local* Postgres data instead, use `pg_dump`/`pg_restore`, or re-run `db:migrate-sqlite` from the original `dev.db` backup.
2. **GitHub.** `git init`, commit, and push to a new GitHub repository (`.gitignore` already excludes `.env`, databases and `node_modules`).
3. **Vercel.** Add New → Project → import the repo. Framework preset **Other**, root directory = repository root (build settings come from `vercel.json`).
4. **Environment variables** (Project → Settings → Environment Variables): `DATABASE_URL` (pooled), `DIRECT_URL` (direct), `SESSION_SECRET`, `APP_URL` (e.g. `https://bluecilantro24.ca`), `NODE_ENV=production`, `BUSINESS_TIMEZONE=America/Edmonton`, plus `SMTP2GO_*`, `TWILIO_*` and `OPS_NOTIFY_*` from `server/.env.example`.
5. **Deploy**, then add your domain under Settings → Domains.

Notes:
- Event dates/times are interpreted in `BUSINESS_TIMEZONE` (Vercel servers run in UTC).
- Order emails/SMS are sent before the order request returns (serverless functions stop after responding), with an 8-second timeout per provider.
- Login/order rate limits are kept in memory, so on Vercel they apply per function instance.

## Other hosts (Render, Railway, a VM)

```bash
npm run build      # builds client/dist
npm start          # Express serves the API and the built site on $PORT
```
Set the same environment variables as above.

## Menu photos

- `client/public/images/menu/baton-*.jpg`: Bâton Rouge's own photos, taken from its group-menu PDF.
- `client/public/images/menu/photos/`: free stock photos from [Unsplash](https://unsplash.com/license). The Unsplash License allows free commercial use with no attribution required; photographer credits are in `photos/credits.json`. These show the *type* of dish, not each restaurant's actual plating, so replace them with the restaurants' own photos when you have them.
- Which photo goes with which item or section is set in `server/prisma/menus/images.js` (used by `npm run db:seed`). You can also change any photo in the admin (item **Photo URL** / category **Banner image URL**).
