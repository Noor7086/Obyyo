import axios from 'axios';

// IMPORTANT: env vars are read LAZILY (at call time), not at module load time.
// Because this module is imported via the route graph before server.js calls dotenv.config(),
// reading process.env at the top of this file would capture empty values.
const getConfig = () => ({
  baseUrl: process.env.HOSTINGER_REACH_BASE_URL || 'https://developers.hostinger.com',
  token: process.env.HOSTINGER_REACH_API_TOKEN,
  profileUuid: process.env.HOSTINGER_REACH_PROFILE_UUID,
  enabled: String(process.env.HOSTINGER_REACH_ENABLED || 'false').toLowerCase() === 'true'
});

const isConfigured = () => {
  const c = getConfig();
  return c.enabled && !!c.token && !!c.profileUuid;
};

// Phone must be E.164: leading "+" then 7-15 digits. Strip everything else and return null if invalid.
const toE164 = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const digits = raw.replace(/[^\d+]/g, '');
  const normalized = digits.startsWith('+') ? digits : `+${digits}`;
  return /^\+\d{7,15}$/.test(normalized) ? normalized : null;
};

const trimToMax = (s, max) => {
  if (s == null) return null;
  const str = String(s);
  return str.length > max ? str.slice(0, max) : str;
};

const buildClient = (baseUrl, token) =>
  axios.create({
    baseURL: baseUrl,
    timeout: 8000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

/**
 * Create a contact in Hostinger Reach. Non-throwing: returns { ok, status, data, error }.
 * Safe to call without await (fire-and-forget) for non-critical paths.
 */
export const createReachContact = async ({ email, name, surname, phone, note }) => {
  const cfg = getConfig();
  if (!isConfigured()) {
    console.warn('[reachService] createContact SKIPPED — Reach not configured', {
      enabled: cfg.enabled,
      hasToken: !!cfg.token,
      hasProfileUuid: !!cfg.profileUuid
    });
    return { ok: false, skipped: true, reason: 'reach_not_configured' };
  }
  if (!email) {
    console.warn('[reachService] createContact SKIPPED — email missing');
    return { ok: false, skipped: true, reason: 'email_missing' };
  }

  const body = {
    email: String(email).trim().toLowerCase(),
    name: name ? String(name).trim() : null,
    surname: surname ? String(surname).trim() : null,
    phone: toE164(phone),
    note: trimToMax(note, 75)
  };

  console.log('[reachService] → POST contact', { email: body.email, name: body.name, hasPhone: !!body.phone });
  try {
    const res = await buildClient(cfg.baseUrl, cfg.token).post(
      `/api/reach/v1/profiles/${cfg.profileUuid}/contacts`,
      body
    );
    console.log('[reachService] ✅ contact created', { email: body.email, status: res.status });
    return { ok: true, status: res.status, data: res.data };
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    console.error('[reachService] ❌ createContact failed', {
      status,
      message: err.message,
      data
    });
    return { ok: false, status, error: err.message, data };
  }
};

/**
 * Delete a contact by its Reach UUID. Non-throwing.
 */
export const deleteReachContact = async (uuid) => {
  const cfg = getConfig();
  if (!isConfigured()) {
    console.warn('[reachService] deleteContact SKIPPED — Reach not configured');
    return { ok: false, skipped: true, reason: 'reach_not_configured' };
  }
  if (!uuid) {
    console.warn('[reachService] deleteContact SKIPPED — uuid missing');
    return { ok: false, skipped: true, reason: 'uuid_missing' };
  }
  console.log('[reachService] → DELETE contact', { uuid });
  try {
    const res = await buildClient(cfg.baseUrl, cfg.token).delete(`/api/reach/v1/contacts/${uuid}`);
    console.log('[reachService] ✅ contact deleted', { uuid, status: res.status });
    return { ok: true, status: res.status, data: res.data };
  } catch (err) {
    const status = err.response?.status;
    console.error('[reachService] ❌ deleteContact failed', {
      status,
      message: err.message
    });
    return { ok: false, status, error: err.message };
  }
};

/**
 * Find a contact by email via the list endpoint (used when we need a UUID to delete later).
 * Returns { ok, uuid } or { ok: false }.
 */
export const findReachContactByEmail = async (email) => {
  const cfg = getConfig();
  if (!isConfigured() || !email) {
    console.warn('[reachService] findByEmail SKIPPED', { configured: isConfigured(), hasEmail: !!email });
    return { ok: false, skipped: true };
  }
  console.log('[reachService] → GET contacts (search by email)', { email });
  try {
    const normalized = String(email).trim().toLowerCase();
    const client = buildClient(cfg.baseUrl, cfg.token);
    // Reach list endpoint is paginated; we scan until we find or exhaust pages (bounded).
    const maxPages = 20;
    for (let page = 1; page <= maxPages; page++) {
      const res = await client.get('/api/reach/v1/contacts', { params: { page } });
      const items = res.data?.data || [];
      const match = items.find((c) => String(c.email || '').toLowerCase() === normalized);
      if (match) return { ok: true, uuid: match.uuid };
      const meta = res.data?.meta || {};
      const totalPages = Math.ceil((meta.total || 0) / (meta.per_page || 15));
      if (page >= totalPages) break;
    }
    return { ok: false, notFound: true };
  } catch (err) {
    console.error('[reachService] findContactByEmail failed', err.message);
    return { ok: false, error: err.message };
  }
};

export const reachIsConfigured = isConfigured;
