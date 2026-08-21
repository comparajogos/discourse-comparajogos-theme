import Component from "@glimmer/component";
import { i18n } from "discourse-i18n";
import { currencyParts } from "../lib/game-catalog";
import CjGameMoney from "./cj-game-money";

/**
 * The market half of the card: cheapest used on the left, cheapest new on the
 * right in the accent, each under its offer count — the reading order of the
 * client's ProductMinPrice.
 *
 * `available` false is a statement, not an absence: the catalog knows the game
 * and knows nobody is selling it. Saying so beats an empty gap.
 */
export default class CjGameCardPrice extends Component {
  get newPrice() {
    return currencyParts(this.args.game.minPriceNew);
  }

  get usedPrice() {
    return currencyParts(this.args.game.minPriceUsed);
  }

  get hasPrice() {
    return Boolean(this.newPrice || this.usedPrice);
  }

  <template>
    <div class="cj-game-card__price">
      {{#if this.hasPrice}}
        {{#if this.usedPrice}}
          <div class="cj-game-card__price-offer --used">
            <CjGameMoney @parts={{this.usedPrice}} />
            <span class="cj-game-card__price-count">
              {{i18n
                (themePrefix "game_card.used_count")
                count=@game.usedCount
              }}
            </span>
          </div>
        {{/if}}
        {{#if this.newPrice}}
          <div class="cj-game-card__price-offer --new">
            <CjGameMoney @parts={{this.newPrice}} />
            <span class="cj-game-card__price-count">
              {{i18n (themePrefix "game_card.new_count") count=@game.newCount}}
            </span>
          </div>
        {{/if}}
      {{else}}
        <span class="cj-game-card__unavailable">
          {{i18n (themePrefix "game_card.unavailable")}}
        </span>
      {{/if}}
    </div>
  </template>
}
