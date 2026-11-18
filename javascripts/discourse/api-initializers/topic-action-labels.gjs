import { apiInitializer } from "discourse/lib/api";
import Composer, { SAVE_LABELS } from "discourse/models/composer";
import { topicActionLabel } from "../lib/topic-action-label";

export default apiInitializer((api) => {
  api.registerValueTransformer("composer-save-button-label", ({ value }) => {
    const model = api.container.lookup("service:composer").model;
    // Editing and creating topics retain their native Save/Create labels.
    return model?.action === Composer.REPLY &&
      value === SAVE_LABELS[Composer.REPLY]
      ? topicActionLabel(model.topic, { composer: true }) || value
      : value;
  });

  // Core exposes footer button registration, but no label hook for its built-in
  // reply button. Replace only that button on the two contextual topic types,
  // retaining the inherited permission check and reply action.
  api.modifyClass(
    "component:topic-footer-buttons",
    (Superclass) =>
      class extends Superclass {
        get cjReplyLabel() {
          return topicActionLabel(this.topic);
        }

        get cjShowContextualReply() {
          return Boolean(super.showCreateButton && this.cjReplyLabel);
        }

        get showCreateButton() {
          return super.showCreateButton && !this.cjReplyLabel;
        }
      }
  );

  api.registerTopicFooterButton({
    id: "cj-contextual-reply",
    icon: "reply",
    title: "topic.reply.help",
    classNames: ["btn-primary", "create", "cj-contextual-reply"],
    priority: -1000,
    label() {
      return this.cjReplyLabel;
    },
    displayed() {
      return this.cjShowContextualReply;
    },
    action: "replyToPost",
  });

  api.registerTopicFooterButton({
    id: "cj-contextual-reply-anon",
    icon: "reply",
    classNames: ["btn-primary", "cj-contextual-reply"],
    priority: -1000,
    anonymousOnly: true,
    label() {
      return topicActionLabel(this.topic);
    },
    displayed() {
      return !api.getCurrentUser() && Boolean(topicActionLabel(this.topic));
    },
    action() {
      api.container.lookup("route:application").send("showLogin");
    },
  });
});
