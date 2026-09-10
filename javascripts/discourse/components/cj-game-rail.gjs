import Component from "@glimmer/component";
import { service } from "@ember/service";
import { bind } from "discourse/lib/decorators";
import DAsyncContent from "discourse/ui-kit/d-async-content";
import DOverflowControls from "discourse/ui-kit/d-overflow-controls";
import { i18n } from "discourse-i18n";
import CjGameMini from "./cj-game-mini";

/**
 * "This thread is about these games" — a scrollable strip of the topic's game
 * tags, above the post stream.
 *
 * Most topics carry exactly one game, so the strip is usually a single chip;
 * comparison threads and trade posts are where it earns the scroll.
 *
 * Core's `DOverflowControls` owns overflow detection and chevrons while the
 * rail keeps its semantic list and card layout through the owned scroller API.
 */
export default class CjGameRail extends Component {
  @service cjGameCatalog;

  get topic() {
    return this.args.outletArgs?.model;
  }

  /* `serializeTags` normalizes topic tags to `{ id, name }` and drops `slug`,
   * so the name is what matches a catalog slug. Older payloads hand back plain
   * strings, which core's own readers still allow for. */
  get tagSlugs() {
    return (this.topic?.tags || [])
      .map((tag) => (typeof tag === "string" ? tag : tag?.name))
      .filter(Boolean);
  }

  /* A string, so the async block reloads when the reader moves to a topic with
   * different tags and not when the same list is merely re-read. */
  get context() {
    return this.tagSlugs.join(",");
  }

  /* The abort signal is ignored for the reason given in cj-game-card-panel. */
  @bind
  async loadGames() {
    const resolved = await this.cjGameCatalog.resolve(this.tagSlugs);
    const games = [...resolved.values()].filter(Boolean);

    /* An empty array is truthy, and `DAsyncContent` picks `content` over
     * `empty` on anything truthy. Null is the honest "nothing to show". */
    return games.length ? games : null;
  }

  <template>
    <DAsyncContent @asyncData={{this.loadGames}} @context={{this.context}}>
      {{! Silent while unresolved, for the reason given in cj-game-card-panel. }}
      <:loading></:loading>
      <:empty></:empty>
      <:content as |games|>
        {{! No visible caption: the chip is self-evidently a game, and the
            topic's own title sits directly beneath it saying the same name. The
            label stays as the region's accessible name so the landmark is still
            announced. }}
        <section
          class="cj-game-rail"
          aria-label={{i18n (themePrefix "game_card.rail_label")}}
        >
          <DOverflowControls
            @axis="horizontal"
            @ownedScroller={{true}}
            as |strip|
          >
            <ul class="cj-game-rail__track" {{strip.scroller}}>
              {{#each games key="slug" as |game|}}
                <li class="cj-game-rail__item">
                  <CjGameMini @game={{game}} />
                </li>
              {{/each}}
            </ul>
          </DOverflowControls>
        </section>
      </:content>
    </DAsyncContent>
  </template>
}
