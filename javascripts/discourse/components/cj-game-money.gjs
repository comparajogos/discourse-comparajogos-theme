/**
 * A price, set the way the client sets one (components/common/Money.tsx): the
 * symbol and the cents small and pinned to the top of a large integer.
 *
 * Spans on a baseline-aligned row rather than `<sup>`: superscript brings its
 * own font-size reduction and vertical shift on top of whatever the card asks
 * for, which is what makes the cents drift away from the number they belong to.
 *
 * The three parts are decoration once assembled, so they are hidden from
 * assistive tech and the whole is announced from `label` instead.
 *
 * @param {object} parts output of `currencyParts` — already localized.
 */
export default <template>
  <span class="cj-game-money" aria-label={{@parts.label}}>
    <span class="cj-game-money__currency" aria-hidden="true">
      {{@parts.currency}}
    </span>
    <span class="cj-game-money__integer" aria-hidden="true">
      {{@parts.integer}}
    </span>
    <span class="cj-game-money__fraction" aria-hidden="true">
      {{@parts.fraction}}
    </span>
  </span>
</template>
