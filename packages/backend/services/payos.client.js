// packages/backend/services/payos.client.js
// Ensure environment variables are loaded before reading them
import 'dotenv/config';
// Lazily import @payos/node to avoid startup crash if the package isn't installed in dev
const hasCreds = Boolean(
  process.env.PAYOS_CLIENT_ID &&
  process.env.PAYOS_API_KEY &&
  process.env.PAYOS_CHECKSUM_KEY
);

const shouldEnable = hasCreds && String(process.env.PAYOS_ENABLED ?? '1') !== '0';

let payos = null;
let payosEnabled = false;

if (!shouldEnable) {
  console.warn('[payOS] Disabled or missing credentials. Payments will run in mock mode.');
} else {
  try {
    const mod = await import('@payos/node');
    // Hỗ trợ nhiều kiểu export/constructor theo phiên bản
    const PayOSCtor = mod?.default?.PayOS || mod?.default || mod?.PayOS;
    try {
      // Thử kiểu object (v2)
      payos = new PayOSCtor({
        clientId: process.env.PAYOS_CLIENT_ID,
        apiKey: process.env.PAYOS_API_KEY,
        checksumKey: process.env.PAYOS_CHECKSUM_KEY,
      });
    } catch (inner) {
      // Fallback: kiểu 3 tham số (v1)
      payos = new PayOSCtor(
        process.env.PAYOS_CLIENT_ID,
        process.env.PAYOS_API_KEY,
        process.env.PAYOS_CHECKSUM_KEY
      );
    }
    payosEnabled = true;
  } catch (err) {
    console.warn('[payOS] Package not installed or failed to load. Running in mock mode:', err?.message || err);
    payos = null;
    payosEnabled = false;
  }
}

export { payosEnabled };
export default payos;
