import { click, visit, waitFor } from "@ember/test-helpers";
import { test } from "qunit";
import { acceptance } from "discourse/tests/helpers/qunit-helpers";

acceptance("Compara Jogos mobile list controls", function (needs) {
  needs.mobileView();
  needs.user();

  test("the filter row can collapse without hiding its fixed actions", async function (assert) {
    await visit("/latest");
    await waitFor(".cj-list-controls-toggle");

    assert
      .dom(".cj-list-controls-toggle")
      .hasAttribute("aria-expanded", "true");
    assert.dom(".list-controls").doesNotHaveClass("is-collapsed");

    await click(".cj-list-controls-toggle");

    assert
      .dom(".cj-list-controls-toggle")
      .hasAttribute("aria-expanded", "false");
    assert.dom(".list-controls").hasClass("is-collapsed");
    assert.dom(".navigation-controls").isVisible();

    await click(".cj-list-controls-toggle");

    assert
      .dom(".cj-list-controls-toggle")
      .hasAttribute("aria-expanded", "true");
    assert.dom(".list-controls").doesNotHaveClass("is-collapsed");
  });
});

acceptance("Compara Jogos desktop list controls", function () {
  test("the collapse handle stays mobile-only", async function (assert) {
    await visit("/latest");

    assert.dom(".cj-list-controls-toggle").doesNotExist();
  });
});
