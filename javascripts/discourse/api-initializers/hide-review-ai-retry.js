import { apiInitializer } from "discourse/lib/api";
import { optionalRequire } from "discourse/lib/utilities";

const aiBotReplies = optionalRequire(
  "discourse/plugins/discourse-ai/discourse/initializers/ai-bot-replies"
);

export default {
  ...apiInitializer((api) => {
    const reviewCategories = (settings.review_categories || "")
      .split("|")
      .filter(Boolean)
      .map(Number);

    api.registerValueTransformer(
      "post-menu-buttons",
      ({ value: buttons, context: { post } }) => {
        if (reviewCategories.includes(post.topic?.category_id)) {
          buttons.delete("ai-retry");
        }
      }
    );
  }),
  after: ["inject-objects", ...(aiBotReplies ? [aiBotReplies.name] : [])],
};
