# Deploying to Shared Hosting (cPanel) — Node.js app

This guide walks through deploying the project to a typical shared hosting account with cPanel that supports Node.js (Application Manager / Setup Node.js App). It assumes you own the domain `mandelamarathon.com` and that you can SSH or use the cPanel UI.

Summary (recommended flow)
- Upload project to your hosting account (via Git, cPanel Upload, or FTP)
- Use cPanel "Setup Node.js App" to create a Node app pointing at the project folder
- Install dependencies on the server (SSH or cPanel terminal)
- Configure environment variables in the cPanel Node App UI (merchant keys, passphrase, notify/return URLs)
- Start the application and configure the domain and SSL
- Configure the PayFast notify URL to point to the live webhook

Files to upload
- All site files in this repository except `node_modules/` and any local `.env` files. The repo already contains a `.env.example` you can copy and fill in on the server.

Two options to get the code onto the server
1) Recommended: Use cPanel's Git Version Control to clone your GitHub repo directly into the app folder.
2) ZIP & Upload: Create a ZIP of the repo (exclude `node_modules`), upload with cPanel File Manager and extract.

Detailed Steps

1) Create app directory (cPanel or SSH)
- Using File Manager or SSH, create a directory for the app, e.g. `~/mandelamarathon` (the exact path will be used when creating the Node app in cPanel).

2) Get the code on the server
- Git (preferred): In cPanel, open "Git Version Control" → Create / Clone Repository → enter the GitHub HTTPS repo URL `https://github.com/kalliedup1-sys/mandelamarathon.git` and choose a destination folder (e.g. `mandelamarathon`).
- ZIP upload: From your local machine create a ZIP without node_modules and .env, upload via File Manager and extract.

3) Setup Node.js App in cPanel
- In cPanel find "Setup Node.js App" (sometimes under "Software" or "Application Manager").
- Create a new application:
  - Node version: pick a current LTS (e.g., 18.x).
  - Application mode: production (or development while testing).
  - Application root: the project folder (where `package.json` and `server.js` live).
  - Application URL: choose the domain or subdomain you want (e.g., `mandelamarathon.com` or `shop.mandelamarathon.com`).
  - Application Startup File: `server.js`

4) Install dependencies
- If cPanel gives a terminal, open SSH/Terminal and run from the app root:

```bash
# from the project root on the server
npm ci --production
```

If `npm ci` fails because `package-lock.json` not present, use `npm install`.

5) Environment variables (critical)
- In the cPanel Node app UI you can set environment variables for the app. Set the following (use production values when ready):

- PAYFAST_MERCHANT_ID = <your-payfast-merchant-id>
- PAYFAST_MERCHANT_KEY = <your-payfast-merchant-key>
- PAYFAST_PASSPHRASE = <your-payfast-passphrase> (optional but recommended)
- PAYFAST_SANDBOX = 0  (set 1 only temporarily for sandbox testing)
- EXPECTED_AMOUNT = 3500.00
- RETURN_URL = https://mandelamarathon.com/thank-you.html
- CANCEL_URL = https://mandelamarathon.com/cancel.html
- NOTIFY_URL = https://mandelamarathon.com/api/payfast-webhook
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (optional if you want email notifications)
- SELLER_EMAIL = accounts@utilisoft.co.za

Important: Do NOT store merchant keys in a publicly committed file. Use cPanel environment variables or a config file outside the webroot with strict file permissions.

6) Start the app
- Use the cPanel UI: click "Run/Start" for the Node app. The UI usually shows the process status and the port mapping.
- If using SSH and a process manager is available, you can use `pm2` or run `node server.js` but prefer the cPanel app manager since it handles restarts.

7) Configure domain & SSL
- If you created the app for a domain/subdomain, ensure that domain's DNS points to the shared hosting account. Typically, set the domain's A record to the hosting server IP in your registrar or cPanel DNS.
- In cPanel, enable AutoSSL for the domain (cPanel > SSL/TLS > Manage AutoSSL) so HTTPS is available.

8) Configure PayFast
- In your PayFast merchant settings, set the notify/instant-notify URL to:

  https://mandelamarathon.com/api/payfast-webhook

- If you use a passphrase, set it in PayFast and ensure `PAYFAST_PASSPHRASE` matches the value in cPanel.

9) Test end-to-end (sandbox first)
- If PayFast sandbox is used, set `PAYFAST_SANDBOX=1` temporarily.
- Perform a sandbox transaction and confirm:
  - Buyer is redirected to `/thank-you.html` after payment.
  - Your server receives a POST to `/api/payfast-webhook` and logs a `VALID` verification from PayFast.
  - The webhook verifies merchant_id and amount and logs the order.

Troubleshooting
- Webhook not reached: verify `NOTIFY_URL` is reachable externally and uses HTTPS. Check server logs and cPanel access/error logs.
- Wrong validation response from PayFast: ensure your server posts back to PayFast's correct validate URL (sandbox vs production) and include passphrase if set.
- Missing env vars in process: restart the Node app via cPanel after editing environment variables.

Optional: Git-based continuous deploy
- Use cPanel's Git Version Control to clone the repo; then in cPanel you can pull updates and restart the app. For automatic deploys, use webhook-based deploys or push-to-deploy if your host supports it.

Cleaning up deployment package
- Locally before uploading, ensure the repo has no secrets and node_modules excluded. Use `.gitignore` already added.

If you want, I can:
- Produce a ZIP of the repo without `node_modules` and `.env` that you can upload to cPanel (I can prepare the file list here), or
- Generate small `deploy.sh` and `.htaccess` snippets if your host needs a proxy configuration.

If you prefer I prepare the ZIP now, say "Please create ZIP" and I'll produce a zip artifact ready for download (or create the list and instructions for zipping locally).
