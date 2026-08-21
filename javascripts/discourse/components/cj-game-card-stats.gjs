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
 * @param {boolean} [labels=true] whether each figure also names itself in
 *   writing. Off, the figures are the bare glyph-and-number pairs of the
 *   client's card; the name still reaches the reader as the figure's `title`.
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

  get showLabels() {
    return this.args.labels ?? true;
  }

  get hasAny() {
    return Boolean(
      this.players || this.playtime || this.complexity || this.rating
    );
  }

  <template>
    {{#if this.hasAny}}
      <div class="cj-game-card__stats">
        <CjGameCardStat
          @icon="users"
          @value={{this.players}}
          @label={{i18n (themePrefix "game_card.players")}}
          @showLabel={{this.showLabels}}
        />
        <CjGameCardStat
          @icon="clock"
          @value={{this.playtime}}
          @label={{i18n (themePrefix "game_card.minutes")}}
          @showLabel={{this.showLabels}}
        />
        <CjGameCardStat
          @icon="graduation-cap"
          @value={{this.complexity}}
          @label={{i18n (themePrefix "game_card.complexity")}}
          @showLabel={{this.showLabels}}
        />
        <CjGameCardStat
          @icon="star"
          @value={{this.rating}}
          @label={{i18n (themePrefix "game_card.rating")}}
          @showLabel={{this.showLabels}}
        />
      </div>
    {{/if}}
  </template>
}
