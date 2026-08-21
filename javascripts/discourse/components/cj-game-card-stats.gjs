import Component from "@glimmer/component";
import { i18n } from "discourse-i18n";
import { formatDecimal, playerRange, playtimeRange } from "../lib/game-catalog";
import CjGameCardStat from "./cj-game-card-stat";

/**
 * The client's four-figure summary (components/product/ProductIcons.tsx):
 * how many play, how long, how heavy, how well rated.
 *
 * Icon choices are the ones `discourse-phosphor-icons` actually maps, so they
 * follow the site's chosen Phosphor weight instead of falling back to Font
 * Awesome the way the old component's `award` and `star-half-alt` did.
 *
 * @param {object} game normalized catalog game
 * @param {boolean} [labels=true] whether each figure names itself. Hosts with
 *   no room for them turn the labels off here rather than hiding them in CSS.
 *   The tag panel's narrow-viewport case is a media query, so that one stays in
 *   the stylesheet.
 */
export default class CjGameCardStats extends Component {
  get players() {
    return playerRange(this.args.game);
  }

  get playtime() {
    return playtimeRange(this.args.game);
  }

  get complexity() {
    return formatDecimal(this.args.game.weight, 1);
  }

  get rating() {
    return formatDecimal(this.args.game.rating, 1);
  }

  get hasAny() {
    return Boolean(
      this.players || this.playtime || this.complexity || this.rating
    );
  }

  get showLabels() {
    return this.args.labels ?? true;
  }

  <template>
    {{#if this.hasAny}}
      <div class="cj-game-card__stats">
        <CjGameCardStat
          @icon="users"
          @value={{this.players}}
          @label={{if this.showLabels (i18n (themePrefix "game_card.players"))}}
        />
        <CjGameCardStat
          @icon="clock"
          @value={{this.playtime}}
          @label={{if this.showLabels (i18n (themePrefix "game_card.minutes"))}}
        />
        <CjGameCardStat
          @icon="graduation-cap"
          @value={{this.complexity}}
          @label={{if
            this.showLabels
            (i18n (themePrefix "game_card.complexity"))
          }}
        />
        <CjGameCardStat
          @icon="star"
          @value={{this.rating}}
          @label={{if this.showLabels (i18n (themePrefix "game_card.rating"))}}
        />
      </div>
    {{/if}}
  </template>
}
