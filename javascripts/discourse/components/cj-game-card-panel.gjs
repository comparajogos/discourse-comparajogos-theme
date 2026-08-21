import Component from "@glimmer/component";
import { service } from "@ember/service";
import { bind } from "discourse/lib/decorators";
import DAsyncContent from "discourse/ui-kit/d-async-content";
import CjGameCard from "./cj-game-card";

/**
 * The tag route's header: the game this tag is about, above its topic list.
 *
 * Deliberately silent until the catalog answers — no skeleton, no spinner. Most
 * tags on this forum are games, but `ficha`, `imagem` and every future marker
 * tag are not, and a placeholder that appears and then collapses on those pages
 * is worse than one that never appears. The service's negative cache means a
 * non-game tag pays for that lookup once per session.
 */
export default class CjGameCardPanel extends Component {
  @service cjGameCatalog;

  get tagSlug() {
    return this.args.outletArgs?.tag?.name;
  }

  /* `DAsyncContent` offers an abort signal for superseded loads; this ignores
   * it on purpose. The lookup is shared and cached across every card on the
   * page, so cancelling it for one component would throw away an answer the
   * others are still waiting for. */
  @bind
  async loadGame(slug) {
    return slug ? await this.cjGameCatalog.resolveOne(slug) : null;
  }

  <template>
    <DAsyncContent @asyncData={{this.loadGame}} @context={{this.tagSlug}}>
      {{! No spinner: see the class comment. }}
      <:loading></:loading>
      <:empty></:empty>
      <:content as |game|>
        {{! `container` aligns the panel with the frame every other discovery
             region shares, the way cj-category-carousel does in the same outlet. }}
        <div class="container cj-game-card-panel">
          <CjGameCard @game={{game}} @variant="panel" />
        </div>
      </:content>
    </DAsyncContent>
  </template>
}
