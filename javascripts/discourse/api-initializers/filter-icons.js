import { apiInitializer } from "discourse/lib/api";

export default apiInitializer((api) => {
  /* Below `md` core collapses the discovery filters into one trigger, and that
   * trigger carries no class saying which filter is current — only its label,
   * which CSS cannot read. The route does know, so it is stamped on <body> for
   * _list-controls.scss to pick the matching glyph. */
  const router = api.container.lookup("service:router");

  api.onPageChange(() => {
    const match = /^discovery\.(?:category)?(\w+)/i.exec(
      router.currentRouteName || ""
    );

    if (match) {
      document.body.dataset.cjFilter = match[1].toLowerCase();
    } else {
      delete document.body.dataset.cjFilter;
    }
  });
});
