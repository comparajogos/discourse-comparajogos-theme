import Component from "@glimmer/component";
import dIcon from "discourse/ui-kit/helpers/d-icon";
import { i18n } from "discourse-i18n";
import { catalogItemUrl, currencyParts } from "../lib/game-catalog";
import CjGameCardStats from "./cj-game-card-stats";
import CjGameMoney from "./cj-game-money";

/**
 * A game as one chip in a topic's rail: cover, name, the four figures without
 * their labels, and the cheapest offer.
 *
 * The whole chip is one link to the catalog item. A rail is scanned, not read,
 * so two targets per chip would be two chances to hit the wrong one on a phone.
 */
export default class CjGameMini extends Component {
  get itemUrl() {
    return catalogItemUrl(this.args.game.slug);
  }

  /* New if anyone is selling new, otherwise used. The chip has room for one
   * number, and the cheaper-condition split belongs on the full card. */
  get price() {
    const { minPriceNew, minPriceUsed } = this.args.game;

    return currencyParts(minPriceNew ?? minPriceUsed);
  }

  get isUsed() {
    return !this.args.game.minPriceNew && Boolean(this.args.game.minPriceUsed);
  }

  /* A rank only, unlike the full card's rank-or-kind badge. "Expansão" is wider
   * than a chip's cover, so the kind would sit on top of the art instead of
   * over a corner of it — and a rank is at most four characters. */
  get badge() {
    const { ranking } = this.args.game;

    return ranking
      ? i18n(themePrefix("game_card.ranking"), { count: ranking })
      : null;
  }

  <template>
    <a href={{this.itemUrl}} class="cj-game-mini" title={{@game.name}}>
      <div class="cj-game-mini__cover">
        {{#if @game.thumbnailUrl}}
          <img
            src={{@game.thumbnailUrl}}
            alt=""
            loading="lazy"
            decoding="async"
          />
        {{else}}
          {{dIcon "puzzle-piece" class="cj-game-mini__cover-fallback"}}
        {{/if}}

        {{#if this.badge}}
          <span class="cj-game-mini__badge">{{this.badge}}</span>
        {{/if}}
      </div>

      <div class="cj-game-mini__body">
        <div class="cj-game-mini__name">{{@game.name}}</div>

        <div class="cj-game-mini__stats">
          <CjGameCardStats @game={{@game}} @labels={{false}} />
        </div>

        <div class="cj-game-mini__price">
          {{#if this.price}}
            <CjGameMoney @parts={{this.price}} />
            {{#if this.isUsed}}
              <span class="cj-game-mini__condition">
                {{i18n (themePrefix "game_card.used")}}
              </span>
            {{/if}}
          {{else}}
            <span class="cj-game-mini__unavailable">
              {{i18n (themePrefix "game_card.unavailable")}}
            </span>
          {{/if}}
        </div>
      </div>
    </a>
  </template>
}
