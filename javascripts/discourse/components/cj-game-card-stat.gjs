import dIcon from "discourse/ui-kit/helpers/d-icon";

/**
 * One figure from the game's data sheet.
 *
 * The label always travels with the figure as its `title`, so the meaning is
 * recoverable everywhere. `@showLabel` decides whether it also spends a line
 * saying so — worth it on the wide tag panel, which is the forum's counterpart
 * of the client's item header; not worth it in a popup or a rail chip, where
 * four named figures will not share a line.
 */
export default <template>
  {{#if @value}}
    <div class="cj-game-card__stat" title={{@label}}>
      <span class="cj-game-card__stat-value">
        {{dIcon @icon class="cj-game-card__stat-icon"}}
        {{@value}}
      </span>
      {{#if @showLabel}}
        <span class="cj-game-card__stat-label">{{@label}}</span>
      {{/if}}
    </div>
  {{/if}}
</template>
