import { apiInitializer } from "discourse/lib/api";
import { wantsNewWindow } from "discourse/lib/intercept-click";
import DiscourseURL from "discourse/lib/url";
import CjGameCardPopup from "../components/cj-game-card-popup";

const MENU_IDENTIFIER = "cj-game-card";
const TAG_MENTION = [
  'a.hashtag-cooked[data-type="tag"]',
  ".ProseMirror a.hashtag-cooked[data-name]",
].join(", ");

let activeClickHandler;

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
 * One capture-level listener covers every hashtag surface: cooked posts, chat,
 * the plain composer preview, and the rich editor. Resolving on interaction
 * avoids racing an async cooked decorator against a preview that is replaced as
 * the user types.
 */
export default apiInitializer((api) => {
  if (activeClickHandler) {
    document.removeEventListener("click", activeClickHandler, true);
    activeClickHandler = null;
  }

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

  async function openCard(event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const mention = event.target.closest(TAG_MENTION);

    if (!mention) {
      return;
    }

    const tagName = tagNameFromHashtag(
      mention.dataset.slug ?? mention.dataset.name
    );

    if (!tagName || wantsNewWindow(event, mention)) {
      return;
    }

    const isRichEditorMention = Boolean(mention.closest(".ProseMirror"));
    const href = isRichEditorMention ? null : mention.getAttribute("href");

    /* Cooked links need to wait for the catalog answer before core routes them.
     * Rich-editor hashtags have editor semantics rather than navigation, so
     * their click is deliberately left untouched while the lookup runs. */
    if (href) {
      event.preventDefault();
    }

    const game = catalog.cached(tagName) ?? (await catalog.resolveOne(tagName));

    if (!mention.isConnected) {
      return;
    }

    if (game) {
      showCard(mention, game.slug, tagName);
      return;
    }

    /* Continue through the same router core uses for cooked links after a miss.
     * Modified clicks never enter this path, so their native browser behavior
     * remains intact. */
    if (href) {
      DiscourseURL.routeTo(href);
    }
  }

  activeClickHandler = openCard;
  document.addEventListener("click", activeClickHandler, true);

  /* The card's own links go to the catalog, which unloads the page, but "ver
   * tópicos" is an in-app transition and the menu would otherwise still be
   * hanging over the tag page the reader just landed on. Closing on any page
   * change covers that link and every future one, rather than each link having
   * to remember to close its own card. */
  api.onPageChange(() => menu.close(MENU_IDENTIFIER));
});
