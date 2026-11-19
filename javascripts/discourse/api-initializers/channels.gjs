import { apiInitializer } from "discourse/lib/api";
import { and, eq, not } from "discourse/truth-helpers";
import CjChannelLinks from "../components/cj-channel-links";
import CjChannelPage from "../components/cj-channel-page";

export default apiInitializer((api) => {
  api.modifyClass(
    "controller:group/index",
    (Superclass) =>
      class extends Superclass {
        init() {
          super.init(...arguments);
          this.queryParams = [...this.queryParams, "channel_team"];
          this.channel_team = false;
        }
      }
  );
  api.renderInOutlet(
    "before-group-container",
    <template><CjChannelPage @group={{@outletArgs.group}} /></template>
  );
  api.renderInOutlet(
    "user-profile-above-collapsed-info",
    <template>
      <CjChannelLinks @username={{@outletArgs.model.username}} />
    </template>
  );
  api.renderInOutlet(
    "user-card-metadata",
    <template>
      <CjChannelLinks @username={{@outletArgs.user.username}} />
    </template>
  );
  api.renderAfterWrapperOutlet(
    "post-links",
    <template>
      {{#if
        (and
          (eq @outletArgs.post.post_number 1)
          (not @outletArgs.post.topic.isPrivateMessage)
        )
      }}
        <CjChannelLinks
          @username={{@outletArgs.post.username}}
          @publication={{true}}
        />
      {{/if}}
    </template>
  );
});
