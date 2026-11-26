# Deploy QuestScout with Neon and Render Free

This setup uses one PostgreSQL database and one Node.js web service. The web
service serves the React build and GraphQL API together. Google, email delivery
and PayPal accounts are optional.

## 1. Create the database

1. Open [Neon](https://console.neon.tech/) and create a project on **Free**.
2. Choose PostgreSQL 17 or later. A region near Frankfurt is a good match for the
   included Render configuration.
3. Open **Connect**, select the application database/role and **Node.js**.
4. Enable **Connection pooling** and copy the PostgreSQL URL. Its hostname
   contains `-pooler`, and the URL normally includes `sslmode=require`.
5. Keep the complete URL private. It includes a database password.

Use this URL as `DATABASE_URL`. The server uses a small, zero-minimum connection
pool, verified TLS and channel binding. Never disable certificate verification.

You can also copy the direct URL with pooling disabled and set it as
`DIRECT_DATABASE_URL`. When omitted, migrations and seeds use `DATABASE_URL`;
both operate inside transactions supported by Neon's pooler.

## 2. Upload the repository

Commit the source, static assets, documentation, root `package-lock.json`,
`.env.example`, `.github` and `render.yaml`. Hidden files matter.

Keep `.env`, `node_modules`, `client/dist`, test reports and database exports out
of Git. `.gitignore` already excludes them. One `npm ci` at the repository root
installs both workspaces.

GitHub Actions runs verification. The live application is hosted on Render;
GitHub Pages cannot execute this Node.js API.

## 3. Create the free web service

In [Render](https://dashboard.render.com/), choose **New → Blueprint**, connect
the repository and select the branch you want to deploy. Render reads
`render.yaml` from the repository root.

Fill in the requested environment values:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Your pooled Neon connection string |
| `ADMIN_EMAIL` | An email you will use to sign in as administrator |
| `ADMIN_PASSWORD` | A unique password of at least 8 characters |
| `DEMO_USER_EMAIL` | A non-personal email used for the shared visitor demo |
| `DEMO_USER_PASSWORD` | A dedicated 8+ character password you can publish with the demo |

The blueprint generates `JWT_SECRET` and selects **Free**. It does not create a
Render PostgreSQL database, disk, paid cron job or background worker.

If creating a **Web Service** manually, use these settings:

| Setting | Value |
| --- | --- |
| Language/runtime | Node |
| Root directory | Leave empty |
| Instance type | Free |
| Region | Frankfurt, or near the Neon database |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Health check path | `/health` |
| Node version | `24` |

Set the same three values above and add:

```dotenv
NODE_ENV=production
NODE_VERSION=24
JWT_SECRET=<a randomly generated secret of at least 32 characters>
APP_TIMEZONE=Europe/Kyiv
SEED_DEMO=true
DEMO_PAYMENTS=true
```

Render supplies `PORT`. Do not configure frontend API URLs: all requests use the
same origin. No `VITE_` variables are needed.

When adding the shared visitor to an existing Blueprint, open the web service's
**Environment** page and add `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD`
manually. Blueprint values declared with `sync: false` are requested only when a
new Blueprint instance is created.

To enable Google, copy the `FIREBASE_*` web configuration from your local `.env`
into Render's Environment tab, enable the Google provider in Firebase
Authentication and add your Render hostname to its authorized domains.
Copy the email and PayPal settings separately; those credentials are private.
For email, use an HTTPS provider on Render Free. See
[authentication setup](authentication.md).

## 4. What happens on the first start

1. Pending SQL migrations create the schema in Neon.
2. An administrator is created from your configured credentials.
3. A protected visitor account is created from the optional demo credentials.
4. `SEED_DEMO=true` adds four rooms, sample reviews and completed sample bookings.
5. The HTTP server starts and `/health` becomes available.

Later starts preserve existing records and passwords. You can set `SEED_DEMO`
to `false` after the initial deployment if you do not want missing demo records
to be restored. Seeding never clears tables.

The configured shared visitor keeps the name `Demo Visitor`, remains unblocked
and uses `DEMO_USER_PASSWORD`. Visitors can create bookings, use demo checkout
and explore account pages, but cannot change the shared profile's name, email or
password. Keep administrator credentials private; only the visitor credentials
are intended to be published.

The bootstrap password is checked when creating a new administrator. Once the
account exists, startup preserves its password; editing `ADMIN_PASSWORD` does
not change the password used to sign in.

## 5. Verify the deployment

- Open the `https://<service-name>.onrender.com` address Render assigns.
- Visit `/escaperooms`, open a room and check its calendar.
- Create a visitor account and make a future booking.
- Open **My bookings → Pay Now → Simulate payment**. No money is charged.
- Sign in as administrator and open the rooms, bookings, users and reviews tabs.
- Refresh a nested page such as `/myaccount` to verify direct routing.
- Add the live address to your GitHub repository's About section and README.

## Free-plan behaviour

Render Free can sleep after 15 minutes without inbound traffic. The next visit
can take about a minute to start the service. The interface includes a startup
message and retry action. Neon also suspends idle compute and wakes it when the
server reconnects.

The application does not run keep-alive requests or a periodic database job.
Expired bookings are reconciled when the API is used. `/health` checks process
readiness without repeatedly waking the database.

Use the providers' Free plans and review their current usage allowances. The
configuration provisions no paid resources; free hosting remains subject to
monthly limits and provider policies.

- [Neon pricing](https://neon.com/pricing)
- [Neon scale to zero](https://neon.com/docs/introduction/scale-to-zero)
- [Render free-service limits](https://render.com/docs/free)

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `DATABASE_URL is missing` | Add the URL in Render's Environment tab, or the local root `.env` |
| Password authentication failed | Copy a fresh URL from Neon; preserve URL-encoded characters |
| TLS/certificate failure | Use a current Node.js 24 runtime and the original Neon URL; keep verification enabled |
| Startup cannot create admin | Use a valid email, an 8+ character password and an email not already registered as a visitor |
| Styles or scripts are missing | Build from the repository root and start the Node service; deploy `client/dist` through the server |
| Nested page gives 404 | Confirm the deployed process uses `NODE_ENV=production` and the current server code |
| Email or Google sign-in is unavailable | Configure the provider settings described in [authentication setup](authentication.md) |
| Changing `ADMIN_PASSWORD` does not change login | Bootstrap preserves existing passwords; update the password through account settings |
| Shared visitor cannot sign in | Add both `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD`, then redeploy the service |

Secrets belong in provider environment settings. Do not paste database URLs,
passwords or API secrets into GitHub issues, screenshots or chat messages.
