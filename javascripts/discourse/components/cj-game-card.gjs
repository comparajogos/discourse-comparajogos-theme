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
 * One component serves two homes — the panel above a tag's topic list and the
 * card a `#tag` mention opens — because they answer the same question and
 * differ only in how much width they get. `@variant` picks the container; the
 * content is identical by decision.
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

  /* The popup is a 24rem card beside a 5.5rem cover; four labelled figures do
   * not fit there, and the reader has just tapped the game's own name so the
   * glyphs have context. */
  get showsStatLabels() {
    return this.variant === "panel";
  }

  get itemUrl() {
    return catalogItemUrl(this.args.game.slug);
  }

  get tagUrl() {
    return this.args.tagName ? getURL(`/tag/${this.args.tagName}`) : null;
  }

  /* Year, kind and publisher read as one line of provenance. Anything the
   * catalog does not know simply drops out rather than leaving a separator
   * behind. `game` is the unmarked case: naming it would be noise on a board
   * game forum, while "Expansão" or "Acessório" is the whole point. */
  get provenance() {
    const { year, type, publisher } = this.args.game;

    return [
      year ? formatInteger(year) : null,
      type && type !== "game"
        ? i18n(themePrefix(`game_card.type.${type}`))
        : null,
      publisher,
    ].filter(Boolean);
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
      </a>

      <div class="cj-game-card__body">
        <div class="cj-game-card__heading">
          <a href={{this.itemUrl}} class="cj-game-card__name">
            {{@game.name}}
          </a>

          {{#if @game.ranking}}
            <span
              class="cj-game-card__ranking"
              title={{i18n (themePrefix "game_card.ranking_title")}}
            >
              {{dIcon "trophy"}}
              {{i18n (themePrefix "game_card.ranking") count=@game.ranking}}
            </span>
          {{/if}}
        </div>

        {{#if this.provenance.length}}
          <p class="cj-game-card__provenance">
            {{#each this.provenance as |fact|}}
              <span class="cj-game-card__fact">{{fact}}</span>
            {{/each}}
          </p>
        {{/if}}

        <CjGameCardStats @game={{@game}} @labels={{this.showsStatLabels}} />
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
