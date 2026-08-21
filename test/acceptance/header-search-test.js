import { click, visit } from "@ember/test-helpers";
import { test } from "qunit";
import { acceptance, exists } from "discourse/tests/helpers/qunit-helpers";

/*
 * The theme renders its own header search field on the widths core declines
 * (cj-header-search.gjs). The gate matters more than the styling: if it drifts
 * after a core upgrade, either the field disappears from mobile again or two
 * SearchMenus mount over the same input id.
 */

acceptance("Compara Jogos header search - mobile", function (needs) {
  needs.mobileView();

  test("the theme renders the search field core leaves out", async function (assert) {
    await visit("/latest");

    assert.true(
      exists(".d-header .cj-header-search .search-menu"),
      "the collapsed field is in the header"
    );
    assert.false(
      exists(".d-header .floating-search-input"),
      "core's own field stays absent, so only one SearchMenu mounts"
    );
    assert.true(
      exists(".cj-sidebar-toggle"),
      "the attached navigation trigger replaces the header hamburger"
    );

    await click(".cj-sidebar-toggle");

    assert.true(
      exists(".hamburger-panel"),
      "the custom trigger opens the mobile navigation drawer"
    );
  });
});

acceptance("Compara Jogos header search - desktop", function () {
  test("core's field renders and the theme's stands down", async function (assert) {
    await visit("/latest");

    assert.false(
      exists(".d-header .cj-header-search"),
      "the theme field only exists on the widths core declines"
    );
  });
});
