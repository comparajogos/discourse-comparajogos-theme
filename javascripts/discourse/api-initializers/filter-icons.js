import { apiInitializer } from "discourse/lib/api";

export default apiInitializer((api) => {
  /* Below `md` core collapses the discovery filters into one trigger, and that
   * trigger carries no class saying which filter is current — only its label,
   * which CSS cannot read. The route does know, so it is stamped on <body> for
   * _list-controls.scss to pick the matching glyph. */
  const router = api.container.lookup("service:router");

  api.onPageChange(() => {
    const match = /^discovery\.(\w+)/i.exec(router.currentRouteName || "");

    if (!match) {
      delete document.body.dataset.cjFilter;
      return;
    }

    /* Core names these after the scope as well as the filter, and on either side
     * of it: `discovery.category` for a category's default list (which *is*
     * latest), `discovery.topCategory` for its Top. Strip the scope from both
     * ends and default the remainder. */
    const filter =
      match[1]
        .replace(/category$/i, "")
        .replace(/^category/i, "")
        .toLowerCase() || "latest";

    document.body.dataset.cjFilter = filter;
  });
});
