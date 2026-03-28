#!/usr/bin/env node
/**
 * Run once: node generate-vapid-keys.js
 * Copy the output keys into your backend .env
 */
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('\nAdd these to your backend .env:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_EMAIL=hello@yourdomain.com\n`);
