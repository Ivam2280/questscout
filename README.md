# QuestScout

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQL-Apollo-E10098?logo=graphql&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-ISC-blue)

QuestScout is a full-stack escape-room discovery and booking platform. Visitors
can explore available missions, check schedules, create bookings and manage
their account, while administrators can operate rooms, bookings, users and
reviews from a dedicated dashboard.

The project combines a responsive React interface with a GraphQL API and a
PostgreSQL database hosted on Neon. Optional integrations add Google sign-in,
email verification and PayPal Sandbox payments.

## Live demo

**Application:** [https://questscout.onrender.com](https://questscout.onrender.com)

Use the protected shared visitor account to explore bookings, account pages and
the built-in demonstration checkout:

| Email | Password |
| --- | --- |
| `client@questscout.example` | `client123` |

The shared profile's name, email and password cannot be changed. Payments are
simulated and do not contact PayPal or charge real money. The free Render
instance may need a short moment to wake after a period of inactivity.

## Features

- Responsive quest catalogue with search, filtering and sorting
- Detailed room pages with schedules, pricing, reviews and availability
- User registration, password login and email-code authentication
- Password recovery and verified email changes
- Optional Google authentication through Firebase
- Booking creation, cancellation, history and payment status tracking
- Demo checkout and optional PayPal Sandbox payments and refunds
- User profile and security management
- Reviews with ratings and administrator replies
- Administrative dashboard for rooms, bookings, users and reviews
- Role-based routes, rate limiting and validated GraphQL operations
- Automated unit, integration and browser testing

## Technology

| Area | Tools |
| --- | --- |
| Client | React, Vite, React Router, Apollo Client, Tailwind CSS |
| Interface | Framer Motion, Lucide, Material UI, Recharts |
| API | Node.js, Express, Apollo Server, GraphQL |
| Database | PostgreSQL, Neon, Sequelize, SQL migrations |
| Authentication | JWT, bcrypt, Firebase Authentication |
| Email | SMTP, EmailJS or Resend |
| Payments | PayPal Sandbox and built-in demo checkout |
| Testing | Node test runner, Playwright, PostgreSQL integration tests |
| Deployment | Render, Neon and GitHub Actions |

## Screenshots

### Home

![QuestScout authenticated home page](docs/screenshots/01-home.webp)

### Quest catalogue

![QuestScout quest catalogue](docs/screenshots/02-quest-catalogue.webp)

### Quest details

![QuestScout quest details and booking page](docs/screenshots/03-quest-details.webp)

<details>
<summary><strong>View more screenshots (12)</strong></summary>

<br>

### Date and time selection

![QuestScout date and time selection](docs/screenshots/04-date-and-time.webp)

### How to book

![QuestScout booking guide](docs/screenshots/05-how-to-book.webp)

### Rules

![QuestScout rules page](docs/screenshots/06-rules.webp)

### Authentication

![QuestScout authentication form](docs/screenshots/15-login.webp)

### Account

![QuestScout authenticated account page](docs/screenshots/07-my-account.webp)

### Upcoming bookings

![QuestScout authenticated upcoming bookings](docs/screenshots/08-my-bookings.webp)

### Booking history

![QuestScout authenticated booking history](docs/screenshots/09-booking-history.webp)

### Room administration

![QuestScout room administration](docs/screenshots/10-admin-rooms.webp)

### Booking administration

![QuestScout booking administration](docs/screenshots/11-admin-bookings.webp)

### User administration

![QuestScout user administration](docs/screenshots/12-admin-users.webp)

### Mobile

<table>
  <tr>
    <th>Home</th>
    <th>Quest catalogue</th>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/13-home-mobile.webp" width="390" alt="QuestScout authenticated mobile home page">
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/14-quest-catalogue-mobile.webp" width="390" alt="QuestScout mobile quest catalogue">
    </td>
  </tr>
</table>

</details>

## Project structure

```text
questscout/
├── client/
│   ├── public/               # Static room images and favicon
│   ├── src/
│   │   ├── components/       # Shared interface components
│   │   ├── lib/              # Apollo Client configuration
│   │   ├── pages/            # Public, account and admin pages
│   │   └── utils/            # Queries, mutations and client utilities
│   └── vite.config.mjs
├── server/
│   ├── config/               # Environment, PostgreSQL and Firebase setup
│   ├── db/                   # SQL migrations and migration runner
│   ├── models/               # Sequelize models
│   ├── schemas/              # GraphQL schema and resolvers
│   ├── services/             # Auth, bookings, mail, rooms and payments
│   ├── tests/                # Unit and integration tests
│   └── server.js
├── tests/e2e/                # Playwright browser tests
├── docs/                     # Setup and deployment documentation
├── .env.example              # Safe configuration template
├── render.yaml               # Render Blueprint
└── package.json              # Workspace scripts
```

## Getting started

### Prerequisites

- Node.js 24 (the version is declared in `.nvmrc`)
- npm 11 or later
- A free [Neon](https://neon.tech/) PostgreSQL project

Firebase, email and PayPal are optional. The application can run without them
using password authentication and demo checkout.

### 1. Install the project

```bash
git clone <repository-url>
cd questscout
nvm use
npm ci
```

The repository uses npm workspaces, so the root command installs both the
client and server dependencies. Do not run separate installs inside the
workspace directories.

### 2. Create a Neon database

1. Create a free project in the [Neon Console](https://console.neon.tech/).
2. Open **Connect** and select the application database and role.
3. Enable **Connection pooling**.
4. Copy the Node.js connection string.
5. Keep `sslmode=require` in the connection string.

The application uses the pooled connection for normal traffic. A direct
connection can optionally be supplied for migrations.

### 3. Configure environment variables

Create a local configuration from the safe template:

```bash
cp .env.example .env
```

At minimum, configure these values:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=replace-with-a-random-string-at-least-32-characters-long
```

Generate a suitable JWT secret locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Optional initial administrator credentials can also be added:

```dotenv
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-at-least-8-characters
```

Both administrator fields must be set together. They are used only to create
the initial administrator; existing passwords are never reset during startup.

For a public portfolio deployment, an optional protected visitor can be
created with:

```dotenv
DEMO_USER_EMAIL=client@questscout.example
DEMO_USER_PASSWORD=client123
```

The visitor can use normal booking and demo-checkout flows, but cannot change
the shared profile credentials.

### 4. Prepare the database

```bash
npm run db:setup
```

This applies pending SQL migrations and, when `SEED_DEMO=true`, adds four rooms
and demonstration activity. Seeding is idempotent and preserves existing
accounts, bookings and passwords.

### 5. Start development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs on port `3001`
by default, and Vite proxies API requests during development.

## Environment variables

All configuration belongs in the root `.env` file. That file is ignored by Git
and must never be committed. The committed `.env.example` contains no real
credentials.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled Neon PostgreSQL connection string |
| `DIRECT_DATABASE_URL` | No | Optional direct URL for migrations and seeding |
| `JWT_SECRET` | Yes | Secret used to sign application sessions; minimum 32 characters |
| `PORT` | No | API port, defaults to `3001` |
| `AUTH_RATE_LIMIT` | No | Sensitive authentication requests per IP and minute; defaults to `20` |
| `API_RATE_LIMIT` | No | GraphQL requests per IP and minute; defaults to `180` |
| `APP_TIMEZONE` | No | Booking timezone, defaults to `Europe/Kyiv` |
| `SEED_DEMO` | No | Adds missing demonstration rooms and activity |
| `DEMO_PAYMENTS` | No | Enables checkout without external PayPal credentials |
| `ADMIN_EMAIL` | No | Email for the initial administrator |
| `ADMIN_PASSWORD` | No | Initial administrator password; minimum 8 characters |
| `DEMO_USER_EMAIL` | No | Email for the protected shared visitor account |
| `DEMO_USER_PASSWORD` | No | Shared visitor password; minimum 8 characters |
| `FIREBASE_*` | No | Firebase web configuration for Google sign-in |
| `MAIL_PROVIDER` | No | `auto`, `smtp`, `emailjs` or `resend` |
| `SMTP_*` | No | SMTP host and credentials for local email delivery |
| `EMAILJS_*` | No | EmailJS server-side delivery configuration |
| `RESEND_API_KEY` | No | Resend API key |
| `EMAIL_FROM` | No | Verified sender address |
| `PAYPAL_CLIENT_ID` | No | PayPal Sandbox REST application client ID |
| `PAYPAL_CLIENT_SECRET` | No | PayPal Sandbox REST application secret |
| `PAYPAL_UAH_PER_USD` | No | Demonstration UAH-to-USD conversion rate |

See [.env.example](.env.example) for the complete template.

## Optional integrations

### Google authentication

Create your own Firebase project, enable the Google provider and add the local
and deployed hostnames to **Authentication → Settings → Authorized domains**.
Copy the Firebase web configuration to the corresponding `FIREBASE_*` fields.

Firebase web configuration identifies your Firebase project, but database,
mail and payment secrets always remain server-side.

### Email verification and recovery

QuestScout supports SMTP, EmailJS and Resend. For local Gmail SMTP, create a
Google App Password and configure:

```dotenv
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-address@gmail.com
SMTP_PASSWORD=your-google-app-password
```

Verify SMTP authentication without sending a message:

```bash
npm run mail:check
```

Render Free blocks normal SMTP ports, so use EmailJS or Resend for a free public
deployment. Full provider instructions are available in
[docs/authentication.md](docs/authentication.md).

### PayPal Sandbox

Create your own REST application in the PayPal Developer Dashboard and add its
Sandbox credentials:

```dotenv
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
```

Use a separate **Personal Sandbox account** as the buyer. Never use the Business
seller account or real PayPal credentials during development. Leave
`DEMO_PAYMENTS=true` to keep the built-in demonstration checkout available.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API and Vite client together |
| `npm run build` | Create the production client build |
| `npm start` | Start the Node.js server |
| `npm run db:migrate` | Apply pending SQL migrations |
| `npm run db:seed` | Add configured seed data without clearing the database |
| `npm run db:setup` | Run migrations and seeding |
| `npm run mail:check` | Verify configured SMTP credentials |
| `npm test` | Run server unit tests |
| `npm run test:db` | Run PostgreSQL integration tests |
| `npm run test:e2e` | Run Playwright browser tests |
| `npm run check` | Run unit tests and the production build |

## Testing

Run the standard project check:

```bash
npm run check
```

Database and browser tests require a dedicated PostgreSQL database whose name
ends in `_test`:

```bash
TEST_DATABASE_URL=postgresql://.../questscout_test npm run test:db
TEST_DATABASE_URL=postgresql://.../questscout_test npm run test:e2e
```

Never point test commands at a development or production database.

## Production deployment

The included [render.yaml](render.yaml) deploys the API and React build as one
Render web service. Neon remains the PostgreSQL provider.

1. Push the repository to GitHub.
2. In Render, create a new **Blueprint** from the repository.
3. Supply `DATABASE_URL`, administrator credentials and optional shared visitor
   credentials when requested.
4. Add your optional Firebase, mail and PayPal variables in Render.
5. Deploy and verify the `/health` endpoint.

GitHub Pages cannot host this project because it requires a Node.js API and a
PostgreSQL database. See [docs/deployment.md](docs/deployment.md) for the full
free-tier deployment guide.

## Security

- Real credentials are never included in the repository.
- `.env`, build output, database exports and test reports are ignored by Git.
- Passwords are hashed with bcrypt and sessions are signed with JWT.
- Firebase ID tokens are verified by the server before issuing a session.
- PayPal orders and captured amounts are verified server-side.
- GraphQL requests use authentication, authorization, rate limits and query
  complexity limits.

If a credential has ever been shared publicly, rotate it before using the
project even if it has since been removed from the repository.

## Documentation

- [Authentication, email and PayPal setup](docs/authentication.md)
- [Neon and Render deployment](docs/deployment.md)
- [Image credits](docs/assets.md)

## Author

Developed by **Ivan Tovstukha**.

## License

This project is available under the [ISC License](LICENSE).
