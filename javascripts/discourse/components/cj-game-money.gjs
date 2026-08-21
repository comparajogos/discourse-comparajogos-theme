/**
 * A price, set the way the catalog sets one: cents as a superscript beside a
 * large integer.
 *
 * @param {object} parts output of `currencyParts` — already localized, so the
 *   thousands separator and the symbol are the reader's, not hardcoded.
 */
export default <template>
  <span class="cj-game-money">
    <sup class="cj-game-money__currency">{{@parts.currency}}</sup>
    <span class="cj-game-money__integer">{{@parts.integer}}</span>
    <sup class="cj-game-money__fraction">{{@parts.fraction}}</sup>
  </span>
</template>
