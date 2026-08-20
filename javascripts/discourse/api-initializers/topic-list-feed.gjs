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
});
