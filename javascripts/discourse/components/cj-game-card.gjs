import Component from "@glimmer/component";
import getURL from "discourse/lib/get-url";
import dIcon from "discourse/ui-kit/helpers/d-icon";
import { i18n } from "discourse-i18n";
import { catalogItemUrl, formatInteger } from "../lib/game-catalog";
import CjGameCardPlayers from "./cj-game-card-players";
import CjGameCardPrice from "./cj-game-card-price";
import CjGameCardStats from "./cj-game-card-stats";

/**
 * The game behind a tag, at full detail.
 *
 * One component, one look, three sizes. The panel above a tag's topic list and
 * the card a `#tag` mention opens answer the same question, so `@variant` picks
 * only the scale — cover width and padding. Nothing about the anatomy changes
 * with it.
 *
 * @param {object} game normalized catalog game (lib/game-catalog.js)
 * @param {"panel"|"popup"} variant
 * @param {string} [tagName] the tag the reader arrived through, when it is not
 *   the page they are already on. Only the popup passes it: tapping a mention
 *   used to lose the tag page entirely, so the card has to offer it back.
 */
export default class CjGameCard extends Component {
  get variant() {
    return this.args.variant ?? "panel";
  }

  /* The tag panel is the forum's item page and has the room; the popup does not. */
  get namesFigures() {
    return this.variant === "panel";
  }

  get itemUrl() {
    return catalogItemUrl(this.args.game.slug);
  }

  get tagUrl() {
    return this.args.tagName ? getURL(`/tag/${this.args.tagName}`) : null;
  }

  /* Rank if it has one, otherwise what kind of thing it is — the client's rule
   * (components/product/ProductCard.tsx). `game` is the unmarked case: naming it
   * would be noise on a board game forum, while "Expansão" or "Acessório" is the
   * whole point, and an expansion has no rank of its own to show instead. */
  get badge() {
    const { ranking, type } = this.args.game;

    if (ranking) {
      return i18n(themePrefix("game_card.ranking"), { count: ranking });
    }

    return type && type !== "game"
      ? i18n(themePrefix(`game_card.type.${type}`))
      : null;
  }

  /* Year and publisher, for telling two printings apart. The client's card
   * leaves them to the item page, but a forum reader arrives at this card from a
   * tag they may not recognise, so one muted line earns its place. */
  get provenance() {
    const { year, publisher } = this.args.game;

    return [year ? formatInteger(year) : null, publisher].filter(Boolean);
  }

  <template>
    <article class="cj-game-card cj-game-card--{{this.variant}}">
      <a
        href={{this.itemUrl}}
        class="cj-game-card__cover"
        tabindex="-1"
        aria-hidden="true"
      >
        {{#if @game.thumbnailUrl}}
          <img
            src={{@game.thumbnailUrl}}
            alt=""
            loading="lazy"
            decoding="async"
          />
        {{else}}
          {{dIcon "puzzle-piece" class="cj-game-card__cover-fallback"}}
        {{/if}}

        {{#if this.badge}}
          <span class="cj-game-card__badge">{{this.badge}}</span>
        {{/if}}
      </a>

      <div class="cj-game-card__body">
        <a href={{this.itemUrl}} class="cj-game-card__name">
          {{@game.name}}
        </a>

        {{#if this.provenance.length}}
          <p class="cj-game-card__provenance">
            {{#each this.provenance as |fact|}}
              <span class="cj-game-card__fact">{{fact}}</span>
            {{/each}}
          </p>
        {{/if}}

        <CjGameCardStats @game={{@game}} @labels={{this.namesFigures}} />
        <CjGameCardPlayers @game={{@game}} />

        <div class="cj-game-card__footer">
          <CjGameCardPrice @game={{@game}} />

          <div class="cj-game-card__actions">
            <a href={{this.itemUrl}} class="cj-game-card__action">
              {{i18n (themePrefix "game_card.visit_item")}}
            </a>
            {{#if this.tagUrl}}
              <a href={{this.tagUrl}} class="cj-game-card__action">
                {{i18n (themePrefix "game_card.visit_tag")}}
              </a>
            {{/if}}
          </div>
        </div>
      </div>
    </article>
  </template>
}
