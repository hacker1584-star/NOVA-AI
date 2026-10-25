# Turn on email verification (no more fake emails)

Do this once. It uses Brevo, which has a free plan (300 emails a day). Keys go ONLY in Render, never in chat.

## A. Brevo
1. Make a free account at brevo.com.
2. Open **Senders, Domains & Dedicated IPs** > **Senders** > **Add a sender**. Use your own email. Brevo sends you a link: tap it to confirm.
3. Open the menu (your name, top right) > **SMTP & API** > **SMTP** tab. You will see **Server**, **Port** and **Login**.
4. Tap **Generate a new SMTP key**. Copy it and keep it ready (you only see it once).

## B. Render > your service > Environment (add each as a new variable)
| Key | Value |
|---|---|
| SMTP_HOST | smtp-relay.brevo.com |
| SMTP_PORT | 587 |
| SMTP_USER | the Login from Brevo |
| SMTP_PASSWORD | the SMTP key |
| SMTP_FROM | the sender email you confirmed in step A2 |
| NIMBUS_ADMIN_EMAILS | your own email (owner: no daily limits) |

Tap **Save Changes**. Render redeploys.

## C. Check
1. Control > Security check: the email line should be green.
2. Sign up with a new email in a private tab. You should get a 6-digit code by email.
3. Look in Spam if it is not in the inbox (emails from a Gmail sender can land there).
4. Your own account: on next sign-in Nimbus emails YOU a code once, to confirm your address. After that you are the verified owner.
