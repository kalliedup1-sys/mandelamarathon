# mandelamarathon.com — For Sale

This repository contains a minimal, attractive landing page you can use to advertise the domain `mandelamarathon.com` for sale.

Files added
- `index.html` — simple, mobile-friendly For Sale page with a Buy Now label and an offer form (mailto-based).
- `style.css` — small stylesheet to make the page look modern and high-quality.

Quick next steps
1. Confirm the contact email in `index.html` is `accounts@utsworld.net` (already set by this update). If you want a different email displayed, tell me and I'll update it.
2. Upload these files to a static host: GitHub Pages, Netlify, Vercel, or any shared hosting. GitHub Pages is the easiest if you have a GitHub account.

Suggested pricing & reasoning
Firm pricing
- Buy-It-Now (BIN): R3,500 ZAR. Price is final — no negotiations. Please ensure your buyer is ready to pay the full amount before initiating the transfer.

Why this range?
- "mandelamarathon" is a descriptive, brandable name for an event and ties to a globally-known name (Nelson Mandela), which increases buyer interest but also introduces legal/sensitivity considerations.
- Comparable domain sales for event or branded keywords often sit in the low-thousands unless there's a strong commercial or trademark pull.

Important legal & sensitivity notes
- The Mandela name is associated with a real person and family; usage may trigger trademark, personality/publicity, or cultural sensitivity concerns. Before using the name for a business or event, a buyer should confirm rights and permissions.
- As a seller, avoid implying affiliation with the Mandela Foundation or family unless you have written permission. Represent the domain honestly when contacting buyers.
- This README is not legal advice. Consider a quick consult with a lawyer if you expect institutional buyers or are contacted by organizations tied to the Mandela family.

Where to list the domain
- Domain marketplaces: Sedo, Afternic, Flippa, GoDaddy Auctions, Namecheap Marketplace
- Auction platforms: Flippa (auctions), GoDaddy Auctions
- Broker services: Domain brokers (Sedo Broker, GoDaddy Brokerage) — helpful for high-value or sensitive domains
- Direct outreach: Contact relevant event organizers, charities, or foundations (e.g., marathon organizers in South Africa, charities working with Mandela family themes) — send a short, polite pitch.

Recommended sales & transfer process (safety-first)
1. Get the buyer to agree to terms in writing.
2. Recommended: Use Escrow.com for payment and domain transfer. Escrow holds funds while the domain is transferred and releases them when both parties confirm — this is the safest option.
3. If buyer prefers a direct bank transfer to a South African account (e.g., Capitec), follow these manual steps:
	- Do NOT release the auth/EPP code or transfer until funds have fully cleared into your account.
	- Ask the buyer for a bank reference and a copy/screenshot of the payment.
	- Verify the incoming payment by checking with your bank (do not rely solely on a buyer-provided screenshot).
	- Only after your bank confirms cleared funds should you provide the auth/EPP code or initiate the registrar transfer.
4. If you want partial automation (webhook-based verification + automatic email of auth code), you'll need a secure server and a payment provider that offers verifiable webhooks. This requires development, HTTPS hosting, and credentials for the payment provider; I can build that flow if you want and provide hosting/deployment instructions.

Marketing copy suggestions (short emails/DMs)
- Subject: Domain for sale — mandelamarathon.com
- Body: Hi [Name], I own mandelamarathon.com and I'm selling it for R3,500 (fixed price). It's a short, memorable domain ideal for marathon/event branding in South Africa. If interested, reply to this email (accounts@utilisoft.co.za) and we'll confirm payment and transfer steps.

Deployment / try-it
- GitHub Pages: create a repository, push these files to the `main` branch, then enable GitHub Pages in repo Settings (use root). See GitHub Pages docs.
- Netlify: drag-and-drop the folder or connect the repo — free tier supports instant publishing.

Follow-ups I can help with
- Edit the page copy or adjust the price shown.
- Add a small contact form backed by Formspree or Netlify Forms (so offers post to an email or webhook).
- Create a short outreach email template package and a list of likely buyers.

If you'd like, I can also:
- Prepare a deployable ZIP of the site ready to upload.
- Create a simple serverless webhook + verification flow (requires a payment provider that supports webhooks and a place to host the webhook).
- Add optional bank payment instructions (Capitec) to the page — only after you confirm which account details you want published.

Important: I cannot, and will not, implement an insecure automatic release-of-auth-code tied directly to a bank transfer without a secure escrow or verified webhook setup. It's unsafe and exposes you to fraud. I can implement a secure automated flow, but it requires a payment provider that issues verifiable webhooks and a hosted server component.

PayFast integration (what I added)
- I added a PayFast hosted-checkout form to `index.html` (placeholders for `merchant_id`, `merchant_key`, `notify_url`, `return_url`). Replace these placeholders with your real values before publishing.
- I added a PayFast hosted-checkout form to `index.html`. Your Merchant ID has been inserted into the form. The Merchant Key was also inserted into `index.html` per your request.

After-payment pages
- The site now includes a simple confirmation page (`thank-you.html`) and a cancellation page (`cancel.html`). The server-side `api/create-payfast` accepts relative paths (for example `/thank-you.html`) and will convert them to absolute URLs using the request host so local/ngrok testing works. For production, set `RETURN_URL` and `CANCEL_URL` (or provide full URLs in the form) to `https://your-site.example/thank-you.html` and `https://your-site.example/cancel.html`.

Security note: Do NOT commit `index.html` with your Merchant Key to any public repository. For production it's strongly recommended to:
- Keep sensitive credentials (Merchant Key, passphrase) out of static files and store them as environment variables on your hosting provider (Vercel/Netlify/Azure). Replace static fields with server-side rendering or move to a server-side checkout creation flow.
- Rotate the Merchant Key / Passphrase in PayFast if you suspect it may be exposed.
- I added a serverless webhook handler at `api/payfast-webhook.js`. This is a Vercel-style function that will receive PayFast notifications, log them to `payfast-orders.log`, and optionally send you an email if SMTP env vars are configured.

How to proceed (step-by-step)
1. Create / log in to your PayFast merchant account and get your Merchant ID and Merchant Key.
2. (Optional but recommended) Set a Passphrase in your PayFast account. Keep it secret.
3. Decide where to host the webhook: Vercel (recommended for ease), Netlify Functions, or another HTTPS host. I used a Vercel-style handler at `api/payfast-webhook.js`.
4. Configure environment variables on your hosting provider (Vercel/Netlify) instead of embedding secrets in `index.html`:
   - `PAYFAST_MERCHANT_ID` — your PayFast Merchant ID
   - `PAYFAST_MERCHANT_KEY` — your PayFast Merchant Key (keep secret)
   - `PAYFAST_PASSPHRASE` — (optional) your PayFast passphrase
   - `RETURN_URL`, `CANCEL_URL`, `NOTIFY_URL` — optional defaults for redirect/notify endpoints
5. Deploy the site + webhook (example: push to a GitHub repo and connect to Vercel). The client page will POST to `/api/create-payfast`, which will generate the PayFast form server-side and forward the buyer to PayFast without exposing your key.
6. Configure PayFast: set the notify URL to the webhook URL (e.g., `https://your-site.vercel.app/api/payfast-webhook`) and (if you set a passphrase) use that passphrase for signing.
7. Test in sandbox mode (PayFast sandbox URL is `https://sandbox.payfast.co.za/eng/process`) then switch to production.

Local testing (recommended before publishing)
1. Install Node.js (LTS) if not already installed. On Windows, download from https://nodejs.org and install.
2. In PowerShell, from the project folder run:

```powershell
npm install
copy .env.example .env
# edit .env and paste your PayFast sandbox credentials (or production if ready)
notepad .env
node server.js
```

3. Open http://localhost:3000 in your browser to view the site locally. The server exposes the API routes used in the site at:
- POST /api/create-payfast
- POST /api/payfast-webhook

4. If you want PayFast to reach your local webhook (recommended for end-to-end testing), expose your local server with ngrok (https://ngrok.com):

```powershell
# download and run ngrok, then expose port 3000
# assuming ngrok.exe is in your PATH
ngrok http 3000
```

5. Copy the HTTPS ngrok URL (e.g. https://abcd1234.ngrok.io) and set your PayFast notify_url to:
	https://abcd1234.ngrok.io/api/payfast-webhook

6. Use the PayFast sandbox to run a test payment. The server's `create-payfast` endpoint will forward to the sandbox when `PAYFAST_SANDBOX=1`.

Publishing options
- Deploy to Vercel (recommended for simplicity and serverless functions): push repo to GitHub and connect to Vercel, set environment variables in the Vercel dashboard, and deploy. Then point your domain `mandelamarathon.com` to Vercel (add an A record or CNAME as Vercel instructs) via your cPanel DNS settings.
- Deploy to cPanel (possible for static files and Node app): upload files to your account. If you want server-side endpoints on cPanel, use the "Setup Node.js App" feature in cPanel (if available) to run `server.js`, and configure the environment variables there. Alternatively, host static files on cPanel and host the serverless functions on Vercel.

Environment variables for webhook (set these in your hosting provider):
- `SMTP_HOST` — your SMTP host (optional; if omitted the webhook will only log to file)
- `SMTP_PORT` — SMTP port (default 587)
- `SMTP_USER` — SMTP username
- `SMTP_PASS` — SMTP password
- `SELLER_EMAIL` — where the webhook will send the notification (defaults to `accounts@utilisoft.co.za`)

Notes on automation
- The webhook currently only logs notifications and sends a notification email. It does NOT auto-release the EPP code. If you want auto-release, tell me and I will add that (it requires explicit opt-in and careful verification logic).

If you want me to finish the setup I can:
- Replace the placeholders in `index.html` with your Merchant ID/Key and an exact notify_url if you provide them.
- Configure the webhook to send the EPP code automatically after verified payment (strongly recommend manual release first).
- Help deploy to Vercel and show how to set the required environment variables.
