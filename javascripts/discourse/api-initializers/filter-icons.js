import { apiInitializer } from "discourse/lib/api";

export default apiInitializer((api) => {
  /* Below `md` core collapses the discovery filters into one trigger, and that
   * trigger carries no class saying which filter is current — only its label,
   * which CSS cannot read. The route does know, so it is stamped on <body> for
   * _list-controls.scss to pick the matching glyph. */
  const router = api.container.lookup("service:router");

  api.onPageChange(() => {
    const routeName = router.currentRouteName || "";
    const match = /^discovery\.(\w+)/i.exec(routeName);

    if (!match) {
      /* A selected tag uses a `tag.*` route even though its ordering control is
       * still the discovery Latest picker. Keep the same default glyph there;
       * deleting the marker made the icon disappear exactly when a tag was
       * selected. */
      if (/^tags?\./i.test(routeName)) {
        document.body.dataset.cjFilter = "latest";
        return;
      }

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
