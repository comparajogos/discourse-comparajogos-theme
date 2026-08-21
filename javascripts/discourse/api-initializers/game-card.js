import { apiInitializer } from "discourse/lib/api";
import CjGameCardPanel from "../components/cj-game-card-panel";
import CjGameRail from "../components/cj-game-rail";

/* A board game on this forum *is* a tag: the tag name is the catalog's product
 * slug and the tag description is the game's proper name. These two outlets are
 * where a reader is already looking at that tag — the tag's own topic list, and
 * a topic filed under it. */

export default apiInitializer((api) => {
  if (settings.game_card_tag_page) {
    api.renderInOutlet("discovery-above", CjGameCardPanel);
  }

  if (settings.game_card_topic_rail) {
    api.renderInOutlet("topic-above-post-stream", CjGameRail);
  }
});
