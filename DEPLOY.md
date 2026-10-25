# Deploying Nimbus, step by step

**Short version:** put the code on GitHub, then run it on a host that supports a long-running Python/Docker app **with a persistent disk**. The easiest is **Render**; the cheapest always-on is **Fly.io** or a small **VPS**.

## Why not Vercel (or Netlify, GitHub Pages)?

GitHub Pages only serves static files. Vercel and Netlify run short-lived serverless functions with a read-only, disposable filesystem. Nimbus keeps accounts, chats and every user's files in a database + folder, streams long replies and runs scheduled tasks in the background, so it needs a normal server with a disk. (You *can* host just the web page on Vercel, but then you'd still need a server for everything else, which is more work for no gain.)

## What you'll need before deploying

1. A **GitHub** account.
2. **At least one model key** (see `API_KEYS.md`; Gemini/Groq are free).
3. A host account (Render, Fly.io, or a VPS provider).
4. Optional: Google / Twilio / SMTP keys (see `AUTH_SETUP.md`).

## Step 1: Put the code on GitHub

```bash
cd nimbus-assistant
git init -b main            # skip if already a repo
git add .
git commit -m "Nimbus"
```

On github.com click **New repository** (name it `nimbus-assistant`, leave "Add README" **off**, choose **Private** if you want), then:

```bash
git remote add origin https://github.com/YOUR_USER/nimbus-assistant.git
git push -u origin main
```

Check on GitHub that **no `.env` file** was uploaded (`.gitignore` blocks it). The included workflows run the tests on every push (`ci.yml`) and build a Docker image (`docker.yml`).

## Step 2A: Render (easiest)

1. Sign in at https://render.com with GitHub.
2. **New + → Blueprint**, pick your repo. Render reads `render.yaml`.
3. It asks for the secret values. Fill in at least one of `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENROUTER_API_KEY` / etc., and `NIMBUS_PUBLIC_URL` (you can put a placeholder, then update it after step 5).
4. Click **Apply**. The first build takes a few minutes.
5. Open the URL Render gives you (like `https://nimbus-xxxx.onrender.com`). Go to the service's **Environment** tab, set `NIMBUS_PUBLIC_URL` to that exact URL, save (it redeploys).
6. Open the site, click **Create account**. Done.

Notes: the blueprint uses a paid instance with a **1 GB persistent disk** (mounted at `/data`) so accounts and chats survive redeploys. A free instance has no disk (everything resets on every deploy) and sleeps when idle, which also stops scheduled tasks. For anything beyond a demo, use the disk.

## Step 2B: Fly.io (always-on, cheap)

```bash
curl -L https://fly.io/install.sh | sh        # install flyctl, then: fly auth signup
cd nimbus-assistant
fly launch --no-deploy --copy-config          # accept the Dockerfile, pick a unique app name and region
fly volumes create nimbus_data --size 1       # the persistent disk
fly secrets set GEMINI_API_KEY=xxxx NIMBUS_PUBLIC_URL=https://YOUR-APP.fly.dev
fly deploy
```

`fly.toml` already keeps one machine running so scheduled tasks fire. Add more keys with more `fly secrets set NAME=value`.

## Step 2C: Your own server (VPS) with Docker and HTTPS

Any small Linux VPS works (1 GB RAM is enough).

```bash
# on the server (Ubuntu): install Docker
curl -fsSL https://get.docker.com | sh
git clone https://github.com/YOUR_USER/nimbus-assistant && cd nimbus-assistant
cp .env.example .env && nano .env              # add keys, NIMBUS_PUBLIC_URL=https://your.domain
docker compose up -d --build
```

Point your domain's DNS **A record** at the server's IP, then put HTTPS in front with Caddy (automatic certificates):

```bash
sudo apt install -y caddy
printf 'your.domain {\n  reverse_proxy 127.0.0.1:8000 {\n    flush_interval -1\n  }\n}\n' | sudo tee /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

`flush_interval -1` keeps streamed replies flowing. Update later with `git pull && docker compose up -d --build`. In `docker-compose.yml`, bind the port to localhost (`"127.0.0.1:8000:8000"`) once Caddy is in place so only HTTPS is reachable.

## Step 3: Check it works

```bash
curl https://YOUR-SITE/api/health
# {"status":"ok","version":"2.0.0","ready":true,"problem":null}
```

- `"ready": false`: the default model has no key; see the `problem` text.
- Sign up in the browser, send a message, switch models in the picker.
- Replies arriving all at once means a proxy is buffering; turn off buffering for the site.

## Safe-deployment checklist

- [ ] **HTTPS only** (Render/Fly do this for you). Cookies are marked Secure automatically on HTTPS.
- [ ] **Keys only in the host's environment settings**, never in GitHub. Set a **spending limit** with each paid provider.
- [ ] **Decide who may sign up:** leave open, set `NIMBUS_SIGNUP_CODE`, or `NIMBUS_ALLOW_SIGNUP=0` and add people with `nimbus adduser`.
- [ ] **Per-user limits** are on by default (`NIMBUS_DAILY_LIMIT`, `NIMBUS_IMAGE_DAILY_LIMIT`, `NIMBUS_USER_QUOTA_MB`); tune them to your budget.
- [ ] **Leave `NIMBUS_ENABLE_CODE_EXEC=0`** on a public site unless you accept the risk: the code interpreter runs model-written Python on your server. It's time- and memory-limited and sees none of your secrets, but it is not a full sandbox (it can still use the network and the CPU). Enable it only on a throwaway/isolated host or for trusted users.
- [ ] **Set up SMTP** so email sign-ups are confirmed and users can reset passwords.
- [ ] **Back up the data folder** (`/data`: `nimbus.db` plus `users/`). On Render use disk snapshots; on a VPS copy the Docker volume.
- [ ] **Update** regularly (`git pull`, redeploy) and watch your provider dashboards for unusual usage.
- [ ] Run **one instance only** (SQLite + the scheduler assume a single process). Don't scale to several replicas.

## Updating and rolling back

Push to `main`; Render redeploys automatically (or `fly deploy` / `docker compose up -d --build`). Data lives on the disk, not in the image, so updates keep accounts and chats. To roll back, redeploy the previous commit.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "model or endpoint not found" | Run `nimbus models --discover`, put valid ids in `NIMBUS_<PROVIDER>_MODELS`. |
| "rate limit or free-tier quota reached" | Free tier is used up; wait, or pick another provider in the model picker. |
| Google `redirect_uri_mismatch` | `NIMBUS_PUBLIC_URL` and the Authorized redirect URI must match exactly. |
| No SMS arrives | Twilio trial limits or country sender rules; see `AUTH_SETUP.md`. |
| Logged out on every deploy | No persistent disk, or `NIMBUS_DATA_DIR` isn't on it. |
| Everyone shows the same IP / limits trigger together | Your proxy must forward the client address (`X-Forwarded-For`); Render, Fly and Caddy do. |


## Keep accounts and chats on a free host (GitHub backup)

Render's free plan wipes its disk every time the site restarts or goes to sleep, so accounts and chats vanish.
A paid plan with a disk (see `render.yaml`) fixes that properly. The free alternative is Nimbus's built-in backup:
every few minutes it saves one compressed snapshot of the database and files into a **private** GitHub repository,
and restores it automatically when the server starts on an empty disk.

1. On GitHub create a new repository named `nimbus-data`. Choose **Private** and tick **Add a README file**.
2. Open https://github.com/settings/personal-access-tokens/new and create a fine-grained token:
   name `nimbus-backup`, **Repository access: Only select repositories** and pick `nimbus-data`,
   **Repository permissions: Contents: Read and write**. Copy the token.
3. In Render, open your service, then **Environment**, and add two variables:
   `NIMBUS_BACKUP_REPO` = `your-username/nimbus-data` and `NIMBUS_BACKUP_TOKEN` = the token. Save.
4. In Nimbus open Settings. Under **Chat storage** you should see "Your chats and account are backed up".

The snapshot contains password hashes and chats, so keep that repository private and never share the token.
Only the newest snapshot is kept (older ones are deleted), uploaded files are included up to about 30 MB in total,
and you should run a single instance of the app.
