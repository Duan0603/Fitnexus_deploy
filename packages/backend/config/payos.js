// Re-export from the hardened PayOS client to keep a single source of truth
import payos, { payosEnabled } from '../services/payos.client.js';
export default payos;
export { payosEnabled };
