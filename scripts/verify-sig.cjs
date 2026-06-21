// Temporary diagnostic: verify the freshly-signed admin cookie's HMAC against
// the secret Vercel reportedly uses. Delete after use.
const crypto = require('crypto');
const fs = require('fs');

const cookieFile = process.argv[2] || '/tmp/fresh.txt';
const raw = fs.readFileSync(cookieFile, 'utf8');
const m = raw.match(/glamo-admin-session\s+(\S+)/);
if (!m) { console.error('No admin cookie in', cookieFile); process.exit(2); }
const cookie = m[1];
const [payload, sig] = cookie.split('.');

// Vercel-reported value (what you pasted):
const vercelSecret = 'acd5e474e74d0bd7f037953b1dde78eeb7807f24dcb0cd0782e36567f540ef3f';

const expected = crypto.createHmac('sha256', vercelSecret).update(payload).digest('base64url');

console.log('payload:    ', payload.slice(0, 50) + '...');
console.log('cookie sig: ', sig.slice(0, 50) + '...');
console.log('expected sig (acd5e474...):', expected.slice(0, 50) + '...');
console.log('');
console.log('MATCH:', expected === sig ? '✅ YES — Vercel IS using acd5e474...' : '❌ NO — cookie signed by something else');
