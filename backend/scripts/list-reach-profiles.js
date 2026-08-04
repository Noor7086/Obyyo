/**
 * One-off helper: list all Hostinger Reach profiles available to the current API token.
 * Run from the backend/ folder:
 *
 *   node scripts/list-reach-profiles.js
 *
 * Copy the printed "uuid" of the profile you want to use into
 * HOSTINGER_REACH_PROFILE_UUID in backend/.env.
 */
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const BASE_URL = process.env.HOSTINGER_REACH_BASE_URL || 'https://developers.hostinger.com';
const TOKEN = process.env.HOSTINGER_REACH_API_TOKEN;

if (!TOKEN) {
  console.error('❌ HOSTINGER_REACH_API_TOKEN is not set in backend/.env');
  process.exit(1);
}

// Hostinger does not publish their REST base URL on the same domain as the docs,
// so we try the docs domain first and fall back to the more common api host.
const candidateBases = [
  BASE_URL,
  'https://api.hostinger.com',
  'https://developers.hostinger.com'
].filter((v, i, a) => a.indexOf(v) === i);

const tryBase = async (base) => {
  const url = `${base}/api/reach/v1/profiles`;
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    return { ok: true, base, data: res.data };
  } catch (err) {
    return {
      ok: false,
      base,
      status: err.response?.status,
      message: err.message,
      data: err.response?.data
    };
  }
};

const main = async () => {
  console.log('🔎 Trying to list Reach profiles...\n');
  for (const base of candidateBases) {
    console.log(`→ ${base}/api/reach/v1/profiles`);
    const result = await tryBase(base);
    if (result.ok) {
      console.log(`\n✅ Worked with base: ${result.base}\n`);
      // Response is an array of subscription/plan objects, each containing a `profiles` array.
      const plans = Array.isArray(result.data) ? result.data : [result.data];
      const profiles = plans.flatMap((plan) => plan?.profiles || []);
      if (profiles.length === 0) {
        console.log('⚠️  No profiles found. Create a Reach profile in the Hostinger dashboard first.');
        process.exit(0);
      }
      console.log(`📋 Found ${profiles.length} profile(s):\n`);
      profiles.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.brand_name || '(unnamed)'}  (${p.domain || 'no domain'})`);
        console.log(`     uuid: ${p.uuid}`);
        console.log('');
      });
      console.log('👉 Paste the uuid above into HOSTINGER_REACH_PROFILE_UUID in backend/.env');
      process.exit(0);
    } else {
      console.log(`   ✗ status=${result.status || 'network'} - ${result.message}`);
      if (result.data) console.log(`   body: ${JSON.stringify(result.data).slice(0, 200)}`);
      console.log('');
    }
  }
  console.error('❌ Could not list profiles from any of the candidate base URLs.');
  console.error('   Check your token, and the API base URL from your Hostinger dashboard.');
  process.exit(1);
};

main();
