import Component from "@glimmer/component";
import { service } from "@ember/service";
import CjGameCard from "./cj-game-card";

/**
 * The card a `#tag` mention opens.
 *
 * Reads the cache rather than the network: the mention only carries
 * `data-cj-game` because the catalog already answered for it while the post was
 * being decorated, so by the time anyone can tap it the game is known. That is
 * what keeps the card instant and keeps a tap from ever showing a spinner.
 */
export default class CjGameCardPopup extends Component {
  @service cjGameCatalog;

  get game() {
    return this.cjGameCatalog.cached(this.args.data?.slug);
  }

  <template>
    {{#if this.game}}
      <CjGameCard
        @game={{this.game}}
        @variant="popup"
        @tagName={{@data.tagName}}
      />
    {{/if}}
  </template>
}
