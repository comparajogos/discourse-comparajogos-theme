import { click, settled, visit, waitUntil } from "@ember/test-helpers";
import { test } from "qunit";
import { acceptance, exists } from "discourse/tests/helpers/qunit-helpers";

/*
 * The theme renders a SearchMenu field on widths where core declines its full
 * HeaderSearch. The gate matters more than the styling: if it drifts after an
 * upgrade, the field either disappears or mounts twice.
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
    await waitUntil(() =>
      document
        .querySelector(".d-header .cj-header-search")
        ?.classList.contains("is-transition-ready")
    );
    assert
      .dom(".d-header .cj-header-search")
      .hasClass(
        "is-transition-ready",
        "interaction transitions arm after the mount geometry settles"
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
      "core's full HeaderSearch remains absent"
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

  test("closing the software keyboard dismisses search results", async function (assert) {
    await visit("/latest");
    await click("#cj-header-search-input");

    assert
      .dom(".cj-header-search .search-menu-panel")
      .exists("focusing the input opens the search panel");

    const appEvents = this.container.lookup("service:app-events");
    appEvents.trigger("keyboard-visibility-change", true);
    appEvents.trigger("keyboard-visibility-change", false);
    await settled();

    assert
      .dom(".cj-header-search .search-menu-panel")
      .doesNotExist("dismissing the keyboard closes the search panel");
    assert.notStrictEqual(
      document.activeElement?.id,
      "cj-header-search-input",
      "the compact field releases focus"
    );
  });
});

acceptance("Compara Jogos header search - desktop", function () {
  test("core and outlet fields trade places across the breakpoint", async function (assert) {
    await visit("/latest");

    assert.false(
      exists(".d-header .cj-header-search"),
      "the outlet field only exists on the widths core declines"
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
    const appEvents = this.container.lookup("service:app-events");
    site.set("narrowDesktopView", true);
    appEvents.trigger("site-header:force-refresh");
    await settled();

    assert.true(
      exists(".d-header .cj-header-search"),
      "the outlet field mounts when the viewport narrows"
    );
    assert.false(
      exists(".d-header .floating-search-input"),
      "core removes its desktop field at the same breakpoint"
    );

    site.set("narrowDesktopView", false);
    appEvents.trigger("site-header:force-refresh");
    await settled();

    assert.false(
      exists(".d-header .cj-header-search"),
      "the outlet field unmounts when the viewport widens again"
    );
    assert.true(
      exists(".d-header .floating-search-input"),
      "core is once again the only desktop search field"
    );
  });
});
