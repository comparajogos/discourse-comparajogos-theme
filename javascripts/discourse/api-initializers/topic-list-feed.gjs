import { apiInitializer } from "discourse/lib/api";
import CjTopicRow from "../components/cj-topic-row";

/* Columns core builds that the feed row absorbs. Bulk select stays: it is a
 * control, not information, and moderators need it. */
const ABSORBED = [
  "topic",
  "posters",
  "replies",
  "likes",
  "op-likes",
  "views",
  "activity",
];

const INTERACTIVE_TARGETS =
  "a, button, input, select, textarea, [contenteditable='true']";

export default apiInitializer((api) => {
  if (!settings.topic_list_feed) {
    return;
  }

  /* The columns API only drives the table layout; on mobile core renders a
   * separate row template, so the feed row would simply not appear there. The
   * feed row is already a vertical stack, so the one layout serves both. */
  api.registerValueTransformer("topic-list-item-mobile-layout", () => false);

  /* A class on the table beats `:has(.cj-feed)` for styling. */
  api.registerValueTransformer("topic-list-class", ({ value: classes }) => [
    ...classes,
    "--cj-feed",
  ]);

  api.registerValueTransformer("topic-list-columns", ({ value: columns }) => {
    for (const name of ABSORBED) {
      if (columns.has(name)) {
        columns.delete(name);
      }
    }

    /* One cell carries the whole row. The header is suppressed in CSS — a feed
     * has no column labels to sort by. */
    columns.add("cj-feed", { item: CjTopicRow });

    return columns;
  });

  /* The card's hover state covers the full row, so its pointer contract must do
   * the same. Use core's row-click extension point rather than an overlay link:
   * nested author/category/tag/reply actions keep their own destinations, bulk
   * select still runs before this transformer, and modified clicks retain the
   * browser's new-tab behavior. The title remains the single keyboard link. */
  api.registerBehaviorTransformer(
    "topic-list-item-click",
    ({ context, next }) => {
      const { event } = context;

      if (!event.target.closest(".cj-feed")) {
        return next();
      }

      if (event.target.closest(INTERACTIVE_TARGETS)) {
        return next();
      }

      const selection = window.getSelection();

      if (selection && !selection.isCollapsed && selection.toString()) {
        return next();
      }

      const topicLink = event.target
        .closest(".topic-list-item")
        ?.querySelector(".cj-feed__title a.title");

      if (!topicLink) {
        return next();
      }

      event.preventDefault();
      event.stopPropagation();

      if (event.button === 1) {
        window.open(topicLink.href, "_blank", "noopener,noreferrer");
        return;
      }

      topicLink.dispatchEvent(
        new MouseEvent("click", {
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          button: event.button,
          bubbles: true,
          cancelable: true,
        })
      );
    }
  );
});
