/**
 * One-off helper: sanity-check that the Reach contact creation flow works end-to-end.
 *
 * Usage from the backend/ folder:
 *   node scripts/test-reach-contact.js you@example.com "Test" "User" "+14155552671"
 *
 * Email is required. Name, surname, phone are optional.
 * The contact will appear in your Reach dashboard if the call succeeds.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const { createReachContact, reachIsConfigured } = await import('../services/reachService.js');

const [, , email, name, surname, phone] = process.argv;

if (!email) {
  console.error('❌ Usage: node scripts/test-reach-contact.js <email> [name] [surname] [phone]');
  process.exit(1);
}

if (!reachIsConfigured()) {
  console.error('❌ Reach is not configured. In backend/.env, set:');
  console.error('   HOSTINGER_REACH_ENABLED=true');
  console.error('   HOSTINGER_REACH_API_TOKEN=<your-token>');
  console.error('   HOSTINGER_REACH_PROFILE_UUID=<your-profile-uuid>');
  process.exit(1);
}

console.log(`📤 Creating Reach contact for ${email}...\n`);

const result = await createReachContact({
  email,
  name,
  surname,
  phone,
  note: 'manual test from script'
});

if (result.ok) {
  console.log('✅ Success! Hostinger response:');
  console.log(JSON.stringify(result.data, null, 2));
  console.log('\nCheck your Reach dashboard — the contact should appear there.');
} else {
  console.error('❌ Failed.');
  console.error('Status:', result.status);
  console.error('Error:', result.error);
  if (result.data) console.error('Body:', JSON.stringify(result.data, null, 2));
  process.exit(1);
}
