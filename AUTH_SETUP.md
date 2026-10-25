# Sign-in setup: email, Google, phone

Nimbus gives every person their own account (private chats, files, memory and settings). Three ways to sign in:

| Method | Needs setup? |
|---|---|
| **Email + password** | No. Works immediately. |
| **Email confirmation, password reset, emailed task results** | Add an SMTP account (section 1). |
| **Google ("Continue with Google")** | Create Google OAuth keys (section 2). |
| **Phone number (SMS code)** | Create a Twilio account (section 3). |

Without SMTP, email sign-ups are accepted **without confirming the address** (and password reset is unavailable). That is fine for private use, but for a public site set up SMTP so people can't register with someone else's email.

Always set `NIMBUS_PUBLIC_URL` to your site's real address (for example `https://nimbus.example.com`, no trailing slash).

## 1. Email (SMTP)

Any SMTP provider works. Options (check their current free allowances):

- **Brevo**: free daily allowance. Create an account, add and verify a sender (SMTP & API, SMTP keys). Host `smtp-relay.brevo.com`, port `587`.
- **Gmail**: turn on 2-step verification, create an *App password*. Host `smtp.gmail.com`, port `587`, user = your Gmail address. Fine for small sites; Google limits daily sends.
- **Resend / Mailgun / Postmark / your host's email**: use the SMTP details they show.

Set:

```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-login
SMTP_PASSWORD=your-smtp-key
SMTP_FROM=Nimbus <you@yourdomain.com>
```

(`SMTP_SSL=1` for port 465.) New sign-ups then receive a 6-digit code (valid 10 minutes, 5 tries). Password reset and emailed scheduled-task results turn on too. Sending from your own domain with SPF/DKIM set up keeps messages out of spam.

## 2. Google sign-in

1. Go to https://console.cloud.google.com and create (or pick) a project.
2. **APIs & Services → OAuth consent screen**: choose *External*, fill in the app name and your support email, save. Scopes needed are only the basic `openid`, `email`, `profile`. Click **Publish app** so anyone (not just test users) can sign in. These basic scopes don't require Google's verification review.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.**
4. Under **Authorized redirect URIs** add exactly:
   - `https://YOUR-DOMAIN/api/auth/google/callback`
   - for local testing also `http://localhost:8000/api/auth/google/callback`
5. Copy the **Client ID** and **Client secret** into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, set `NIMBUS_PUBLIC_URL`, restart.

The "Continue with Google" button appears automatically. Only Google accounts with a verified email are accepted. If someone first signed up with the same email and password, the accounts are linked only when that email was confirmed; an unconfirmed password sign-up is wiped instead, so nobody can pre-register your email to hijack your Google login.

"redirect_uri_mismatch" means the URI in step 4 doesn't match `NIMBUS_PUBLIC_URL` + `/api/auth/google/callback` exactly (https vs http, trailing slash, wrong domain).

## 2b. GitHub sign-in (free)

1. On GitHub open **Settings > Developer settings > OAuth Apps > New OAuth App**.
2. Application name: `Nimbus`. Homepage URL: your site, for example `https://nimbus-6kui.onrender.com`.
3. **Authorization callback URL:** `https://nimbus-6kui.onrender.com/api/auth/github/callback` (use your own address, exactly).
4. Tap **Register application**. Copy the **Client ID**. Tap **Generate a new client secret** and copy it right away.
5. In Render > Environment add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (and `NIMBUS_PUBLIC_URL` = your site address, no trailing slash, if it is not set). Save and wait for Live.
6. "Continue with GitHub" now shows on the sign-in page. People need a verified email on their GitHub account.

## 2c. Forgot password without email: recovery keys

Every account can make a recovery key (Settings > Recovery key, or tap the banner after signing in). It looks like `NIMB-XXXXX-XXXXX-XXXXX-XXXXX`, is shown once, and works once. On the sign-in page tap **Forgot password?**, enter your email, the key and a new password. You get a new key straight away. This works even when the site cannot send email.

## 3. Phone number (SMS codes)

1. Create an account at https://www.twilio.com and open the Console. Copy **Account SID** and **Auth Token**.
2. Get a sender: buy a phone number (or create a Messaging Service and use its SID that starts with `MG`).
3. Trial accounts can only text numbers you have verified in Twilio. **Upgrade** the account to message anyone. Some countries require sender registration or approved sender IDs before SMS is delivered; Twilio's console explains the rules for each country.
4. Set:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_FROM=+15551234567
```

Users enter numbers with the country code (e.g. `+2348012345678`). **SMS costs money per message**, so Nimbus limits it: 3 codes per number per 15 minutes, 15 per IP per hour, and 300 per day for the whole site (stops SMS-pumping fraud). A code lasts 10 minutes and burns after 5 wrong tries. Keep sign-up gated (`NIMBUS_SIGNUP_CODE`) if you are worried about abuse.

## Administration

- Create an account from the command line (works even with sign-ups closed): `nimbus adduser person@example.com`
- Reset a password: `nimbus passwd person@example.com`
- Close public sign-up: `NIMBUS_ALLOW_SIGNUP=0`. Require an invite code: `NIMBUS_SIGNUP_CODE=something-secret`.
- Users can change their password, create API keys, export chats and **delete their account and all their data** under Settings.
