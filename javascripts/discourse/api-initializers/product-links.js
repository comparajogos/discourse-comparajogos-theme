import { apiInitializer } from "discourse/lib/api";

export default apiInitializer((api) => {
  /* The client's header logo goes to the catalog root, so the forum's does too —
   * the logo is the product's home, not the forum's. */
  const productUrl = (settings.product_url || "").replace(/\/$/, "");

  if (settings.header_logo_links_to_product && productUrl) {
    api.registerValueTransformer("home-logo-href", () => productUrl);
  }

  /* Core's default share glyph reads as an export arrow; the client uses a share
   * node in the same position. */
  api.replaceIcon("d-post-share", "share-nodes");
  api.replaceIcon("d-topic-share", "share-nodes");
});
