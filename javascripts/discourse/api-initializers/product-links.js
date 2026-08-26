import { apiInitializer } from "discourse/lib/api";

export default apiInitializer((api) => {
  const site = api.container.lookup("service:site");

  /* The client's header logo goes to the catalog root, so the forum's does too —
   * the logo is the product's home, not the forum's. */
  const productUrl = (settings.product_url || "").replace(/\/$/, "");

  if (settings.header_logo_links_to_product && productUrl) {
    api.registerValueTransformer("home-logo-href", () => productUrl);
  }

  /* A desktop topic title has enough horizontal room beside the complete
   * product identity. Core may still minimize the logo on mobile, where the
   * compact mark makes room for the title and navigation controls. */
  api.registerValueTransformer("home-logo-minimized", ({ value: minimized }) =>
    site.desktopView ? false : minimized
  );

  /* Core prefers site_mobile_logo_url throughout the mobile app, including
   * ordinary discovery pages. Keep the complete product identity there; the
   * minimized topic header and our expanded-search treatment each request the
   * compact mark through their own explicit paths. */
  api.registerValueTransformer("home-logo-image-url", ({ value, context }) =>
    context?.name === "mobile_logo" ? "" : value
  );

  /* Core's default share glyph reads as an export arrow; the client uses a share
   * node in the same position. */
  api.replaceIcon("d-post-share", "share-nodes");
  api.replaceIcon("d-topic-share", "share-nodes");
});
