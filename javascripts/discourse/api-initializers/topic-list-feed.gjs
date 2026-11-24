import { apiInitializer } from "discourse/lib/api";
import CjTopicRow, {
  CjChannelRow,
  CjMediaRow,
} from "../components/cj-topic-row";

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

/* Match Horizon's boundary for custom topic cards. In particular, private
 * messages use `listContext: "messages"`; leaving that context alone preserves
 * core's participant avatars and PM-specific metadata. */
const TOPIC_FEED_CONTEXTS = [
  "channel",
  "discovery",
  "suggested",
  "related",
  "group-activity",
  "user-activity",
];

const isTopicFeedContext = ({ listContext, category }) =>
  TOPIC_FEED_CONTEXTS.includes(listContext) && !category?.doc_index_topic_id;

export default apiInitializer((api) => {
  if (!settings.topic_list_feed) {
    return;
  }

  /* The columns API only drives the table layout; on mobile core renders a
   * separate row template, so the feed row would simply not appear there. The
   * feed row is already a vertical stack, so the one layout serves both. */
  api.registerValueTransformer(
    "topic-list-item-mobile-layout",
    ({ value, context }) => (isTopicFeedContext(context) ? false : value)
  );

  /* Core sideloads `flair_groups` with every topic list but only stitches
   * `primary_groups` onto posters. */
  api.registerValueTransformer(
    "topic-list-topics-from",
    ({ value: topics, context: { result } }) => {
      const flairGroups = new Map(
        (result.flair_groups ?? []).map((group) => [group.id, group])
      );

      if (flairGroups.size) {
        for (const topic of topics) {
          for (const poster of topic.posters ?? []) {
            poster.flair_group ??= flairGroups.get(poster.flair_group_id);
          }
        }
      }

      return topics;
    }
  );

  const discovery = api.container.lookup("service:discovery");
  const mediaTags = settings.media_list_tags.split("|").filter(Boolean);

  const rowFor = ({ listContext }) => {
    if (listContext === "channel") {
      return CjChannelRow;
    }
    if (mediaTags.includes(discovery.tag?.name)) {
      return CjMediaRow;
    }
    return CjTopicRow;
  };

  /* A class on the table beats `:has(.cj-feed)` for styling. */
  api.registerValueTransformer(
    "topic-list-class",
    ({ value: classes, context }) => {
      if (!isTopicFeedContext(context)) {
        return classes;
      }
      return context.listContext === "channel"
        ? [...classes, "--cj-feed", "--cj-channel"]
        : [...classes, "--cj-feed"];
    }
  );

  api.registerValueTransformer(
    "topic-list-columns",
    ({ value: columns, context }) => {
      if (!isTopicFeedContext(context)) {
        return columns;
      }

      for (const name of ABSORBED) {
        if (columns.has(name)) {
          columns.delete(name);
        }
      }

      /* One cell carries the whole row. The header is suppressed in CSS — a
       * feed has no column labels to sort by. */
      columns.add("cj-feed", { item: rowFor(context) });

      return columns;
    }
  );

  /* The card's hover state covers the full row, so its pointer contract must do
   * the same. Use core's row-click extension point rather than an overlay link:
   * nested author/category/tag/reply actions keep their own destinations, bulk
   * select still runs before this transformer, and modified clicks retain the
   * browser's new-tab behavior. The title remains the single keyboard link. */
  api.registerBehaviorTransformer(
    "topic-list-item-click",
    ({ context, next }) => {
      const { event, topic, listContext } = context;

      if (
        !isTopicFeedContext({
          listContext,
          category: topic?.category,
        })
      ) {
        return next();
      }

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
