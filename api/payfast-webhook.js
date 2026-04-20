// Vercel-style serverless webhook for PayFast notifications (semi-automated)
// - Logs incoming notifications to a local orders.json (if writable in deployment)
// - Optionally sends an email to seller/buyer if SMTP env vars are provided
// Security: this handler does NOT auto-release EPP codes. It records & notifies for manual verification.

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Helper: append to orders log (simple JSON lines)
function logOrder(obj){
  try{
    const file = path.join(__dirname, '..', 'payfast-orders.log');
    fs.appendFileSync(file, JSON.stringify(obj) + '\n');
  }catch(e){
    console.error('Failed to write orders log', e);
  }
}

async function sendEmail(subject, text){
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const to = process.env.SELLER_EMAIL || 'accounts@utilisoft.co.za';

  if(!user || !pass || !host){
    console.log('SMTP not configured; skipping email. Subject:', subject);
    return;
  }

  const transporter = nodemailer.createTransport({
    host, port, secure: port == 465, auth: {user, pass}
  });

  await transporter.sendMail({
    from: user,
    to,
    subject,
    text
  });
}

module.exports = async (req, res) => {
  // Only accept POST from PayFast notify_url
  if(req.method !== 'POST'){
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  // Parse body (Vercel gives parsed body for application/x-www-form-urlencoded)
  const payload = req.body || {};

  // Basic record of incoming notification
  const record = {
    receivedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    payload
  };

  // Log locally immediately
  logOrder(record);

  // Verify notification with PayFast to ensure it's genuine
  try{
    const verified = await verifyPayFastNotification(payload);
    if(!verified){
      console.warn('PayFast notification failed verification:', payload);
      res.statusCode = 400;
      res.end('INVALID');
      return;
    }
  }catch(err){
    console.error('Error verifying PayFast notification', err);
    // don't auto-release; respond 500 so provider may retry
    res.statusCode = 500;
    res.end('ERROR');
    return;
  }

  // Compose a verification email to the seller with transaction details
  const lines = [
    'PayFast notification received for mandelamarathon.com (VERIFIED)',
    '',
    'Timestamp: ' + record.receivedAt,
    'Source IP: ' + record.ip,
    '',
    'Payload:',
    JSON.stringify(payload, null, 2),
    '',
    '----',
    'Verified by PayFast. Important: still confirm the cleared amount in your bank if you prefer manual release.'
  ];

  // Send email (best-effort)
  try{
    await sendEmail('PayFast notification — mandelamarathon.com', lines.join('\n'));
  }catch(err){
    console.error('Failed to send email notification', err);
  }

  // Respond quickly to the provider
  res.statusCode = 200;
  res.end('OK');
};

// Verify PayFast notification by POSTing back to PayFast validate endpoint
const https = require('https');
const querystring = require('querystring');

function buildFormBody(payload, passphrase){
  // Build urlencoded string from payload. Ensure predictable key ordering by sorting keys.
  const keys = Object.keys(payload).sort();
  const parts = keys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(payload[k])}`);
  if(passphrase){
    parts.push(`passphrase=${encodeURIComponent(passphrase)}`);
  }
  return parts.join('&');
}

function verifyPayFastNotification(payload){
  return new Promise((resolve, reject) => {
    const useSandbox = (process.env.PAYFAST_SANDBOX === '1' || process.env.PAYFAST_SANDBOX === 'true');
    const host = useSandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';
    const path = '/eng/query/validate';

    const passphrase = process.env.PAYFAST_PASSPHRASE || '';
    const body = buildFormBody(payload, passphrase);

    const options = {
      host,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        const trimmed = data.trim();
        // PayFast returns 'VALID' on success
        if(trimmed === 'VALID'){
          // additional basic checks: merchant id and amount
          const expectedMerchant = process.env.PAYFAST_MERCHANT_ID;
          if(expectedMerchant && payload.merchant_id && payload.merchant_id !== expectedMerchant){
            console.warn('Merchant ID mismatch', payload.merchant_id, expectedMerchant);
            resolve(false);
            return;
          }

          const expectedAmount = process.env.EXPECTED_AMOUNT || '3500.00';
          const actualAmount = payload.amount || payload.amount_gross || payload.payment_amount || payload.amount_paid || '';
          if(expectedAmount && actualAmount){
            // numeric compare
            const a = parseFloat(actualAmount);
            const b = parseFloat(expectedAmount);
            if(!isNaN(a) && !isNaN(b) && Math.abs(a - b) > 0.01){
              console.warn('Amount mismatch', actualAmount, expectedAmount);
              resolve(false);
              return;
            }
          }

          resolve(true);
        }else{
          console.warn('PayFast validate response:', trimmed);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}
