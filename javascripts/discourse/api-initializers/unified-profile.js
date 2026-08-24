import { apiInitializer } from "discourse/lib/api";

const LEGACY_PROFILE = /(?:^|\/)u\/([^/?#]+)(?:\/summary)?\/?$/;

export default apiInitializer((api) => {
  if (!settings.unified_profile_shell) {
    return;
  }

  const product = (settings.product_url || "").replace(/\/$/, "");
  if (!product) {
    return;
  }

  api.onPageChange((path) => {
    const pathname = new URL(path, window.location.origin).pathname;
    const match = pathname.match(LEGACY_PROFILE);

    if (!match) {
      return;
    }

    window.location.replace(`${product}/u/${encodeURIComponent(match[1])}`);
  });
});
