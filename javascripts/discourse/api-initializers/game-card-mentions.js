import { apiInitializer } from "discourse/lib/api";
import { wantsNewWindow } from "discourse/lib/intercept-click";
import CjGameCardPopup from "../components/cj-game-card-popup";

const TAG_MENTION = 'a.hashtag-cooked[data-type="tag"]';
const GAME_ATTRIBUTE = "cjGame";
const GAME_SELECTOR = "[data-cj-game]";

/**
 * A `#game` mention opens the game's card instead of leaving the page.
 *
 * The mention keeps its `href` throughout. The previous implementation blanked
 * the href on every tag mention so core's click handling would let go of it,
 * which cost a non-game mention its destination and a modified click its new
 * tab. Marking only the mentions the catalog recognised, and cancelling the
 * event with `preventDefault`, gets the same result without taking anything
 * away: `interceptClick` already stands down on a defaulted-prevented event,
 * `ClickTrack` ignores `hashtag-cooked` links outright, and everything the
 * catalog does not recognise is left exactly as core rendered it.
 */
export default apiInitializer((api) => {
  if (!settings.game_card_mentions) {
    return;
  }

  const catalog = api.container.lookup("service:cj-game-catalog");
  const menu = api.container.lookup("service:menu");

  async function openCard(event) {
    const mention = event.target.closest(GAME_SELECTOR);

    if (!mention || wantsNewWindow(event, mention)) {
      return;
    }

    event.preventDefault();

    await menu.show(mention, {
      identifier: "cj-game-card",
      component: CjGameCardPopup,
      placement: "bottom-start",
      fallbackPlacements: ["top-start"],
      trapTab: false,
      data: {
        slug: mention.dataset[GAME_ATTRIBUTE],
        tagName: mention.dataset.slug,
      },
    });
  }

  /* One listener per cooked element rather than one on the document: it is
   * removed with the post or message it belongs to, so nothing outlives the
   * content it was for. A named function keeps re-decoration idempotent. */
  async function markGameMentions(element) {
    const mentions = [...element.querySelectorAll(TAG_MENTION)];

    if (!mentions.length) {
      return;
    }

    element.addEventListener("click", openCard);

    /* One request for every mention in this post, then read the answers back
     * through `cached` rather than the returned map: it normalizes the slug and
     * follows a rename the same way every other surface does, so the attribute
     * always carries the catalog's canonical slug. */
    await catalog.resolve(mentions.map((mention) => mention.dataset.slug));

    mentions.forEach((mention) => {
      const game = catalog.cached(mention.dataset.slug);

      if (game) {
        mention.dataset[GAME_ATTRIBUTE] = game.slug;
      }
    });
  }

  api.decorateCookedElement(markGameMentions);

  /* Chat is optional; its decorator arrives with the plugin. Same signature as
   * the cooked one since chat moved to `decorateCookedMessage`. */
  api.decorateChatMessage?.(markGameMentions);
});
