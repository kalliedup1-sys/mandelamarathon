// Server-side PayFast checkout generator (Vercel-style serverless function)
// - Reads MERCHANT_ID and MERCHANT_KEY from environment variables
// - Accepts a POST with amount, item_name, return_url, cancel_url, notify_url
// - Responds with an HTML form that auto-posts to PayFast including the merchant_key (kept server-side)

const crypto = require('crypto');

function generatePaymentId(){
  return 'mandelamarathon-' + Date.now();
}

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  // read body - Vercel/Netlify typically provide parsed body for urlencoded
  const body = req.body || {};
  const amount = body.amount || '3500.00';
  const item_name = body.item_name || 'mandelamarathon.com domain';
  let return_url = body.return_url || (process.env.RETURN_URL || '/thank-you.html');
  let cancel_url = body.cancel_url || (process.env.CANCEL_URL || '/cancel.html');

  // If a relative path is provided (starts with '/'), convert to absolute using request host
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers.host;
  if(return_url && return_url.startsWith('/') && host){
    return_url = `${proto}://${host}${return_url}`;
  }
  if(cancel_url && cancel_url.startsWith('/') && host){
    cancel_url = `${proto}://${host}${cancel_url}`;
  }
  let notify_url = body.notify_url || (process.env.NOTIFY_URL || '/api/payfast-webhook');
  if(notify_url && notify_url.startsWith('/') && host){
    notify_url = `${proto}://${host}${notify_url}`;
  }

  const merchant_id = process.env.PAYFAST_MERCHANT_ID;
  const merchant_key = process.env.PAYFAST_MERCHANT_KEY;
  const passphrase = process.env.PAYFAST_PASSPHRASE || '';

  if(!merchant_id || !merchant_key){
    res.statusCode = 500;
    res.end('Merchant credentials not configured on server.');
    return;
  }

  const m_payment_id = generatePaymentId();

  // Build the HTML form that posts to PayFast
  const useSandbox = (process.env.PAYFAST_SANDBOX === '1' || process.env.PAYFAST_SANDBOX === 'true');
  const action = useSandbox ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process';
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redirecting to PayFast</title></head><body>
  <p>Redirecting to PayFast… If you are not redirected, click the button below.</p>
  <form id="pf" method="post" action="${action}">
    <input type="hidden" name="merchant_id" value="${escapeHtml(merchant_id)}" />
    <input type="hidden" name="merchant_key" value="${escapeHtml(merchant_key)}" />
    <input type="hidden" name="return_url" value="${escapeHtml(return_url)}" />
    <input type="hidden" name="cancel_url" value="${escapeHtml(cancel_url)}" />
    <input type="hidden" name="notify_url" value="${escapeHtml(notify_url)}" />
    <input type="hidden" name="m_payment_id" value="${escapeHtml(m_payment_id)}" />
    <input type="hidden" name="amount" value="${escapeHtml(amount)}" />
    <input type="hidden" name="item_name" value="${escapeHtml(item_name)}" />
    <button type="submit">Continue to PayFast</button>
  </form>
  <script>document.getElementById('pf').submit();</script>
  </body></html>`;

  res.setHeader('content-type','text/html; charset=utf-8');
  res.end(html);
};
