import { tracked } from "@glimmer/tracking";
import { click, render } from "@ember/test-helpers";
import { module, test } from "qunit";
import { setupRenderingTest } from "discourse/tests/helpers/component-test";
import { i18n } from "discourse-i18n";
import CjRatingTipContent from "../../discourse/components/cj-rating-tip-content";

module("Compara Jogos rating tip", function (hooks) {
  setupRenderingTest(hooks);

  test("the translated button reveals and hides the original details", async function (assert) {
    class State {
      @tracked expanded = false;
      toggle = () => {
        this.expanded = !this.expanded;
      };
    }
    const state = new State();
    await render(
      <template>
        <CjRatingTipContent
          @expanded={{state.expanded}}
          @onToggle={{state.toggle}}
          @details="topic.reply.help"
        />
      </template>
    );

    assert
      .dom("button.cj-rating-tip-toggle")
      .hasText(i18n(themePrefix("topic_actions.rating_tip")));
    assert
      .dom("button.cj-rating-tip-toggle")
      .hasAttribute("aria-expanded", "false");
    await click("button.cj-rating-tip-toggle");
    assert.dom(".tip-details").hasText(i18n("topic.reply.help"));
    assert
      .dom("button.cj-rating-tip-toggle")
      .hasAttribute("aria-expanded", "true");
    await click("button.cj-rating-tip-toggle");
    assert.dom(".tip-details").doesNotExist();
  });
});
