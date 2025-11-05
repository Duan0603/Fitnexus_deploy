// /src/lib/openOAuthPopup.js
export default function openOAuthPopup(
  url,
  {
    backendOrigin = "http://localhost:3001",
    frontendOrigin = window.location.origin,
  } = {}
) {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      url,
      "oauth-google",
      "width=520,height=640,menubar=no,toolbar=no,status=no,scrollbars=yes,resizable=yes"
    );

    if (!popup) return reject(new Error("Popup blocked"));

    let closedCheck = null;
    let resolved = false;

    function cleanup() {
      resolved = true;
      window.removeEventListener("message", onMessage);
      if (closedCheck) clearInterval(closedCheck);
      try {
        popup.close();
      } catch {}
    }

    function onMessage(e) {
      // 🔒 đảm bảo đúng origin
      if (backendOrigin !== "*" && e.origin !== backendOrigin) return;

      const data = e.data || {};
      if (data?.source === "oauth" && data?.provider === "google") {
        cleanup();
        resolve(data);
      }
    }

    window.addEventListener("message", onMessage);

    closedCheck = setInterval(() => {
      if (popup.closed && !resolved) {
        cleanup();
        reject(new Error("Popup closed"));
      }
    }, 400);
  });
}
