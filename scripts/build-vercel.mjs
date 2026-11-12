import { cp, mkdir, rm } from 'node:fs/promises';

// Vercel serves the existing public site files as static assets.
// The API function remains in /api and the main app backend remains on Cloudflare.
const output = '.vercel-static';
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp('public', output, { recursive: true });
console.log('Vercel static site prepared.');
