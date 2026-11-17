import { apiInitializer } from "discourse/lib/api";
import { samePrefix } from "discourse/lib/get-url";

export default apiInitializer((api) => {
  const ownOrigins = new Set([window.location.origin]);
  try {
    ownOrigins.add(new URL(settings.product_url).origin);
  } catch {}

  /* Core chat opens every link outside the /f prefix in a new tab; our own
   * site's pages belong in the same tab. */
  api.decorateChatMessage?.(
    (element) => {
      element.querySelectorAll("a[target='_blank'][href]").forEach((link) => {
        const url = new URL(link.href, window.location.href);
        if (ownOrigins.has(url.origin) && !samePrefix(url.href)) {
          link.removeAttribute("target");
        }
      });
    },
    { id: "cj-own-site-links-same-tab" }
  );
});
