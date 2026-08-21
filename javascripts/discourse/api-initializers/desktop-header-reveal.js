import { dependentKeyCompat } from "@ember/object/compat";
import { apiInitializer } from "discourse/lib/api";
import { SCROLLED_UP } from "discourse/services/scroll-direction";

/* Core already restores the normal header when a member scrolls up inside a
 * topic, but limits that behaviour to mobile. The product navigation is the
 * desktop header's primary way out of a topic, so apply the same tracked scroll
 * direction and tolerance there instead of maintaining a second scroll
 * listener in the theme. */

export default apiInitializer((api) => {
  api.modifyClass(
    "service:header",
    (Superclass) =>
      class extends Superclass {
        @dependentKeyCompat
        get topicInfoVisible() {
          if (
            !this.site.mobileView &&
            this.scrollDirection.lastScrollDirection === SCROLLED_UP
          ) {
            return false;
          }

          return super.topicInfoVisible;
        }
      }
  );
});
