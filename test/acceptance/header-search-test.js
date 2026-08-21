import { click, settled, visit } from "@ember/test-helpers";
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
  needs.settings({
    search_experience: "search_field",
    site_logo_small_url: "/images/small-logo.png",
  });

  test("the theme renders the search field core leaves out", async function (assert) {
    await visit("/latest");

    assert.true(
      exists(".d-header .cj-header-search .search-menu"),
      "the collapsed field is in the header"
    );
    assert
      .dom(".d-header .cj-header-search__small-logo img")
      .hasAttribute(
        "src",
        "/images/small-logo.png",
        "the configured compact logo is ready for the expanded field"
      );
    assert.false(
      exists(".d-header .floating-search-input"),
      "core's own field stays absent, so only one SearchMenu mounts"
    );
    assert.true(
      exists(".d-header .hamburger-dropdown #toggle-hamburger-menu"),
      "core's navigation trigger remains attached to the header"
    );
    assert
      .dom("#toggle-hamburger-menu use")
      .hasAttribute("href", "#ph-bold-sidebar", "the trigger uses Sidebar");

    await click("#toggle-hamburger-menu");

    assert.true(
      exists(".hamburger-panel"),
      "the header trigger opens the mobile navigation drawer"
    );
    assert.true(
      exists(".header-cloak"),
      "the header trigger retains core's navigation cloak"
    );
  });
});

acceptance("Compara Jogos header search - desktop", function () {
  test("core and theme fields trade places across the breakpoint", async function (assert) {
    await visit("/latest");

    assert.false(
      exists(".d-header .cj-header-search"),
      "the theme field only exists on the widths core declines"
    );
    assert.true(
      document.body.classList.contains("has-sidebar-page"),
      "desktop always opens with the sidebar"
    );
    assert.false(
      exists(".cj-sidebar-toggle"),
      "the theme adds no second toggle"
    );

    const site = this.container.lookup("service:site");
    site.set("narrowDesktopView", true);
    await settled();

    assert.true(
      exists(".d-header .cj-header-search"),
      "the theme field mounts when the viewport narrows"
    );
    assert.false(
      exists(".d-header .floating-search-input"),
      "core removes its desktop field at the same breakpoint"
    );

    site.set("narrowDesktopView", false);
    await settled();

    assert.false(
      exists(".d-header .cj-header-search"),
      "the theme field unmounts when the viewport widens again"
    );
    assert.true(
      exists(".d-header .floating-search-input"),
      "core is once again the only desktop search field"
    );
  });
});
