const fallback = (key, value) => {
  console.warn(`[env] ${key} is missing. Using fallback "${value}".`);
  return value;
};

const backendUrlRaw = (import.meta.env?.VITE_BACKEND_URL || "").trim();
const appDownloadUrlRaw = (import.meta.env?.VITE_APP_DOWNLOAD_URL || "").trim();

const backendUrl = backendUrlRaw || fallback("VITE_BACKEND_URL", "/api");
const appDownloadUrl =
  appDownloadUrlRaw ||
  fallback("VITE_APP_DOWNLOAD_URL", "https://fitnexus.app/download");

export const env = {
  backendUrl,
  appDownloadUrl,
};
