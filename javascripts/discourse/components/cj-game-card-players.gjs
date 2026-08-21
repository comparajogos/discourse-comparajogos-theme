import Component from "@glimmer/component";
import { i18n } from "discourse-i18n";
import { playerGroups } from "../lib/game-catalog";

/**
 * Which player counts the game is actually good at, as the client shows them:
 * a darker chip for the community's favourite counts, a lighter one for the
 * merely recommended.
 *
 * Consecutive counts sharing a verdict collapse into a range, so a five-player
 * game reads "1 | 2-4 | 5" rather than five chips — the old component emitted
 * one chip per count and lost the shape of the answer.
 */
export default class CjGameCardPlayers extends Component {
  get groups() {
    return playerGroups(
      this.args.game.bestPlayers,
      this.args.game.recommendedPlayers
    );
  }

  <template>
    {{#if this.groups.length}}
      <div class="cj-game-card__players">
        <span class="cj-game-card__players-label">
          {{i18n (themePrefix "game_card.player_count")}}
        </span>
        {{#each this.groups key="range" as |group|}}
          <span
            class="cj-game-card__player-group
              {{if group.best '--best' '--recommended'}}"
            title={{if
              group.best
              (i18n (themePrefix "game_card.player_count_best"))
              (i18n (themePrefix "game_card.player_count_recommended"))
            }}
          >
            {{group.range}}
          </span>
        {{/each}}
      </div>
    {{/if}}
  </template>
}
