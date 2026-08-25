import { apiInitializer } from "discourse/lib/api";
import { wantsNewWindow } from "discourse/lib/intercept-click";
import CjGameCardPopup from "../components/cj-game-card-popup";

const MENU_IDENTIFIER = "cj-game-card";
const TAG_MENTION = 'a.hashtag-cooked[data-type="tag"]';
const RICH_TAG_MENTION = "a.hashtag-cooked[data-name]";
const GAME_ATTRIBUTE = "cjGame";
const GAME_SELECTOR = "[data-cj-game]";

/* Rich-editor hashtag nodes keep the resolved type in their name only when it
 * is needed to disambiguate two results. A plain name is the usual tag case;
 * an explicitly non-tag result must never become a game mention. */
function tagNameFromHashtag(name) {
  const [tagName, type] = String(name || "").split("::");

  return !type || type === "tag" ? tagName : null;
}

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

  function showCard(mention, slug, tagName) {
    void menu.show(mention, {
      identifier: MENU_IDENTIFIER,
      component: CjGameCardPopup,
      placement: "bottom-start",
      fallbackPlacements: ["top-start"],
      trapTab: false,
      data: { slug, tagName },
    });
  }

  function openCard(event) {
    const mention = event.target.closest(GAME_SELECTOR);

    if (!mention || wantsNewWindow(event, mention)) {
      return false;
    }

    event.preventDefault();
    showCard(
      mention,
      mention.dataset[GAME_ATTRIBUTE],
      mention.dataset.slug ?? mention.dataset[GAME_ATTRIBUTE]
    );

    return true;
  }

  /* The rich editor owns hashtag nodes rather than cooked links. Resolve only
   * the node that was clicked; returning false leaves selection and non-game
   * hashtag behavior entirely with ProseMirror. */
  api.registerRichEditorExtension({
    plugins: {
      props: {
        handleClickOn(_view, _pos, node, _nodePos, event, direct) {
          if (!direct || node.type.name !== "hashtag") {
            return false;
          }

          const mention = event.target.closest(RICH_TAG_MENTION);
          const tagName = tagNameFromHashtag(node.attrs.name);

          if (!mention || !tagName || wantsNewWindow(event, mention)) {
            return false;
          }

          void catalog.resolveOne(tagName).then((game) => {
            if (game && mention.isConnected) {
              showCard(mention, game.slug, tagName);
            }
          });

          return false;
        },
      },
    },
  });

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

  /* The card's own links go to the catalog, which unloads the page, but "ver
   * tópicos" is an in-app transition and the menu would otherwise still be
   * hanging over the tag page the reader just landed on. Closing on any page
   * change covers that link and every future one, rather than each link having
   * to remember to close its own card. */
  api.onPageChange(() => menu.close(MENU_IDENTIFIER));

  api.decorateCookedElement(markGameMentions);

  /* Chat is optional; its decorator arrives with the plugin. Same signature as
   * the cooked one since chat moved to `decorateCookedMessage`. */
  api.decorateChatMessage?.(markGameMentions);
});
