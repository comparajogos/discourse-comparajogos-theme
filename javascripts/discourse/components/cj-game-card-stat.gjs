import dIcon from "discourse/ui-kit/helpers/d-icon";

/**
 * One figure from the game's data sheet.
 *
 * The label is rendered, not tooltipped: four bare numbers behind four glyphs
 * is a riddle for anyone who has not learned the icon set, and a `title` is
 * unreachable by touch. Where there is no room for it — the popup, a rail chip —
 * the host omits `@label` rather than hiding it, so nothing sits in the DOM that
 * the reader can never see.
 */
export default <template>
  {{#if @value}}
    <div class="cj-game-card__stat">
      <span class="cj-game-card__stat-value">
        {{dIcon @icon class="cj-game-card__stat-icon"}}
        {{@value}}
      </span>
      {{#if @label}}
        <span class="cj-game-card__stat-label">{{@label}}</span>
      {{/if}}
    </div>
  {{/if}}
</template>
