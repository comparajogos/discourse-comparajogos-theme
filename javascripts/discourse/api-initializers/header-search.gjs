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
 * the whole shell, admin has its own chrome, and a narrow desktop genuinely
 * has no room.
 */
export default apiInitializer((api) => {
  if (!settings.header_search_everywhere) {
    return;
  }

  api.registerValueTransformer(
    "header-search-visible",
    ({ value, context }) => {
      if (
        context.searchExperience !== "search_field" ||
        context.topicInfoVisible ||
        context.narrowDesktop ||
        context.currentRouteName?.startsWith("admin")
      ) {
        return value;
      }

      return true;
    }
  );
});
