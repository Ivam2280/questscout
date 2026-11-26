# Google, email codes and account recovery

QuestScout supports Google sign-in, sign-in by email code, password recovery,
email changes and local passwords. These features use the Node.js API and
PostgreSQL; migrating the database to Neon does not require replacing them.

Provider settings live in the **root `.env`**, or in the hosting service's
environment settings. Restart the API after changing `.env`, then refresh the
browser. Never commit real passwords, private keys or connection strings.

## Google sign-in with Firebase

1. Open your project in the [Firebase console](https://console.firebase.google.com/).
2. In **Authentication → Sign-in method**, enable **Google**, select a support
   email and save.
3. In **Authentication → Settings → Authorized domains**, add `localhost` for
   local development and your actual Render hostname for deployment. Add
   `127.0.0.1` only if you also use that address. Enter bare hostnames, without
   `http://`, ports or paths.
4. In **Project settings → General → Your apps**, copy the web application's
   Firebase configuration into the root `.env`:

```dotenv
FIREBASE_API_KEY=your-web-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-web-app-id
```

Restart `npm run dev` and open **http://localhost:5173**. Newly created Firebase
projects may require adding `localhost` manually. The storage bucket and sender
ID are included for completeness; this application only uses Firebase Auth.
Do not enable Firestore or move the application database out of Neon.

The browser signs in with Firebase's Google provider, then sends a **Firebase
ID token** to `/auth/google`. The Node.js API verifies its signature, expiry,
project and issuer with the Firebase Admin SDK. Only verified Google identities
are accepted. The API then issues the application's own session token.

This verification path uses the explicitly configured project ID and Google's
public signing certificates. It does not need a service-account private key or
client secret. Firebase web configuration is public and is returned by
`/api/config`; database, mail and payment secrets remain on the server.

On the first Google sign-in, an existing Neon account is linked by verified,
normalized email. Later sign-ins use the stable Firebase UID, including after an
email change in QuestScout. Existing passwords, bookings and administrator
privileges are preserved. New accounts receive visitor privileges and can add
a local password in account settings. Blocked accounts cannot sign in.
Migration `002-firebase-user-link.sql` adds this link without resetting users.

If the popup is blocked, allow popups for the application. An
`auth/unauthorized-domain` error means the current hostname must be added in
Firebase Authentication settings. `auth/operation-not-allowed` means the Google
provider needs to be enabled. Firebase Google sign-in does not configure Gmail
SMTP or replace the application's email-code and recovery services.

- [Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase ID token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Authorized domains and troubleshooting](https://firebase.google.com/docs/auth/faq-and-troubleshooting)

## Gmail or another SMTP provider

For local development, the original Gmail account can be reused with a valid
Google App Password:

```dotenv
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-address@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=
```

`EMAIL_FROM` defaults to `SMTP_USER`. For another mail service, use that
provider's host, port and credentials. Port 587 normally uses
`SMTP_SECURE=false` with STARTTLS; the transport still requires encryption.

For Gmail, enable two-step verification and create an
[App Password](https://myaccount.google.com/apppasswords). Use that password
rather than the Google account's normal password. If SMTP returns
`535: Username and Password not accepted`, confirm the account and generate a
new App Password. Google revokes App Passwords after an account password change.

Check SMTP credentials without sending an email:

```sh
npm run mail:check
```

The command reads the current root `.env`, connects using TLS and verifies SMTP
authentication. A `535` rejection requires correcting `SMTP_USER` or generating
a new App Password for that same mailbox. Account recovery alone does not make
an old App Password valid again. Save the new password in `SMTP_PASSWORD`, run
the check again, then restart the API. Runtime delivery failures write a safe
diagnostic to the API console without printing passwords or verification codes.

- [Google App Password help](https://support.google.com/mail/answer/185833)
- [Nodemailer Gmail guide](https://nodemailer.com/guides/using-gmail)

## Email on Render Free

[Render Free blocks outbound SMTP ports 25, 465 and 587](https://render.com/docs/free).
Use an HTTPS email provider for public deployments. Gmail SMTP remains
supported locally; selecting a different transport does not change the login
or recovery flow.

### EmailJS with an existing Gmail account

EmailJS can connect an existing Gmail mailbox and send through its HTTPS API,
without requiring a custom sender domain. Its
[Free plan](https://www.emailjs.com/pricing/) currently includes 200 requests per
month. Create an EmailJS account, connect Gmail and create one template:

| Template setting | Value |
| --- | --- |
| To Email | `{{to_email}}` |
| Subject | `{{subject}}` |
| Message content | `{{message}}` |

The `{{code}}` variable is also supplied if you want to style the code
separately. Use the same template for login, signup verification, email changes
and password recovery.

In EmailJS **Account → Security**, enable API requests for non-browser
applications, as described in the
[official server SDK documentation](https://github.com/emailjs-com/emailjs-nodejs).
Then configure:

```dotenv
MAIL_PROVIDER=emailjs
EMAILJS_SERVICE_ID=your-service-id
EMAILJS_TEMPLATE_ID=your-template-id
EMAILJS_PUBLIC_KEY=your-public-key
EMAILJS_PRIVATE_KEY=
```

If your EmailJS account requires a private API key, set `EMAILJS_PRIVATE_KEY` as
well. All EmailJS requests are made by the server; the client never receives
these configuration values.

### Resend

Resend remains supported as an alternative. Set `MAIL_PROVIDER=resend`,
`RESEND_API_KEY` and `EMAIL_FROM`. The sender must be authorized by your Resend
account. This provider is not required when Gmail/SMTP or EmailJS is configured.

With `MAIL_PROVIDER=auto`, the server selects a configured EmailJS transport,
then Resend, then SMTP. Set an explicit provider to avoid ambiguity.

## PayPal Sandbox and demo checkout

Configure `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` with sandbox credentials.
The original sandbox application can be reused if its credentials are still
valid. Once configured, PayPal Sandbox becomes available in the payment modal.
With `DEMO_PAYMENTS=true`, a separate demo checkout is also available. Set it
to `false` to offer only PayPal Sandbox.

Both modes are for demonstration and do not charge real money. The backend
binds PayPal orders to the booking, verifies the captured amount/currency and
supports sandbox refunds on cancellation.

Checkout uses **Pay Now** and does not request a shipping address for a room
booking. Each new attempt replaces an unapproved order; approved orders are
retained to finish the same payment. If PayPal has already captured a payment
but the response was interrupted, the server checks the original order and
restores the booking's payment status instead of charging again.

For a sandbox payment, sign in to PayPal with a **Personal** sandbox buyer
account. The REST application's **Business** sandbox account receives the
payment. These are separate accounts; your normal PayPal or Developer Dashboard
password is not the sandbox buyer password. Find or reset test credentials in
[Sandbox Accounts](https://developer.paypal.com/dashboard/accounts).

For the verified Chrome test flow, use a newly created **Personal** sandbox
buyer with **United States** selected as its country. An older buyer account
reproduced `UNKNOWN` after login on PayPal's `/pay` checkout, while the new
Personal (US) buyer completed the payment with the same application and seller
credentials. Creating a different buyer does not require replacing the
Business application's client ID or secret. Keep buyer passwords out of the
repository.

If PayPal shows “Something went wrong” before approval, close that checkout
window and start a new payment attempt from the booking. The previous attempt
has not completed unless PayPal reports a completed capture. Do not manually
mark the booking as paid. Provider errors now retain their issue code and
`debug_id` in server diagnostics, without logging credentials or buyer data.
For an account restriction, inspect the corresponding sandbox account's status
and receiving preferences in the Developer Dashboard.

## What to verify

1. Open login and signup pages and check that the Google button appears.
2. Sign in through Google using a hostname authorized in Firebase Authentication.
3. Enter an existing user's email and choose **Login with Verification Code**.
4. Use **Forgot Key?**, verify the emailed code and save a new password.
5. Open account settings, edit the email and confirm the code sent to the new
   address.
6. Open a booking's checkout and try the configured sandbox or demo method.

Email codes expire after 15 minutes, allow a limited number of attempts and
cannot be reused. Tests use isolated databases and mocked external providers;
they never send email through your real account.
