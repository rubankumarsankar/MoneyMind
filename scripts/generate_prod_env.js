const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Read local .env
const envPath = path.join(process.cwd(), '.env');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error("Could not read .env file");
}

// Parse .env
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

// Generate new secret
const newSecret = crypto.randomBytes(32).toString('base64');

console.log('\n\x1b[36m%s\x1b[0m', '=== VERCEL PRODUCTION CONFIGURATION ===');
console.log('Copy and paste these values into Vercel -> Settings -> Environment Variables\n');

// 1. Database
console.log('\x1b[33m%s\x1b[0m', 'DATABASE_URL');
console.log(envVars.DATABASE_URL || 'MISSING_IN_LOCAL_ENV');
console.log('');

// 2. NextAuth
console.log('\x1b[33m%s\x1b[0m', 'NEXTAUTH_SECRET');
console.log(newSecret);
console.log('\x1b[90m%s\x1b[0m', '(Generated secure random key)');
console.log('');

console.log('\x1b[33m%s\x1b[0m', 'NEXTAUTH_URL');
console.log('https://money-tag.vercel.app'); 
console.log('');

// 3. SMTP (If present)
if (envVars.SMTP_HOST) {
    console.log('\x1b[33m%s\x1b[0m', 'SMTP_HOST');
    console.log(envVars.SMTP_HOST);
    console.log('');
    
    console.log('\x1b[33m%s\x1b[0m', 'SMTP_PORT');
    console.log(envVars.SMTP_PORT);
    console.log('');

    console.log('\x1b[33m%s\x1b[0m', 'SMTP_USER');
    console.log(envVars.SMTP_USER);
    console.log('');

    console.log('\x1b[33m%s\x1b[0m', 'SMTP_PASS');
    console.log(envVars.SMTP_PASS);
    console.log('');
}

// 4. Google (If present)
if (envVars.GOOGLE_CLIENT_ID) {
    console.log('\x1b[33m%s\x1b[0m', 'GOOGLE_CLIENT_ID');
    console.log(envVars.GOOGLE_CLIENT_ID);
    console.log('');

    console.log('\x1b[33m%s\x1b[0m', 'GOOGLE_CLIENT_SECRET');
    console.log(envVars.GOOGLE_CLIENT_SECRET);
    console.log('');
}

console.log('\x1b[36m%s\x1b[0m', '=== END OF CONFIGURATION ===');
console.log('After adding these, redeploy your project on Vercel.');
