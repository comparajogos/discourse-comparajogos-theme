import { apiInitializer } from "discourse/lib/api";

/**
 * Keep the header search field on the surfaces where the client has one.
 *
 * Core hides it below `md` and while the welcome banner's own search is in
 * view. The client's header carries its field at every width — collapsed to a
 * 40px button below `sm`, expanding on focus (see `_header-search.scss`) — and
 * the catalog has no welcome banner to defer to, so the forum's field should
 * not disappear on its busiest page either.
 *
 * Core's own reasons to hide it are left alone: the docked topic title needs
 * the whole shell, admin and the excluded routes have their own chrome, and a
 * narrow desktop genuinely has no room.
 *
 * `header-show-search` does not exist in Discourse yet. registerValueTransformer
 * only warns on an unknown name, so this is inert until core ships it — hence
 * the setting defaulting to false.
 */
export default apiInitializer((api) => {
  if (!settings.header_search_everywhere) {
    return;
  }

  api.registerValueTransformer("header-show-search", ({ value, context }) => {
    if (
      context.searchExperience !== "search_field" ||
      context.topicInfoVisible ||
      context.narrowDesktop ||
      context.isExcludedRoute
    ) {
      return value;
    }

    return true;
  });
});
