import { click, settled, visit, waitUntil } from "@ember/test-helpers";
import { test } from "qunit";
import NarrowDesktop, {
  forceNarrowDesktop,
  resetNarrowDesktop,
} from "discourse/lib/narrow-desktop";
import { cloneJSON } from "discourse/lib/object";
import privateMessagesFixtures from "discourse/tests/fixtures/private-messages-fixtures";
import { acceptance, exists } from "discourse/tests/helpers/qunit-helpers";

/*
 * The theme renders a SearchMenu field on widths where core declines its full
 * HeaderSearch. The gate matters more than the styling: if it drifts after an
 * upgrade, the field either disappears or mounts twice.
 */

async function simulateNarrowDesktop(owner) {
  forceNarrowDesktop();
  NarrowDesktop.init();
  NarrowDesktop.update(owner, true);
  await settled();
}

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

acceptance("Compara Jogos header search - desktop", function (needs) {
  needs.settings({ search_experience: "search_field" });
  needs.hooks.afterEach(() => resetNarrowDesktop());

  test("wide desktop leaves search to core", async function (assert) {
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
  });

  test("the outlet owns narrow desktop search", async function (assert) {
    await simulateNarrowDesktop(this.owner);
    await visit("/latest");

    assert.true(
      exists(".d-header .cj-header-search"),
      "the outlet field mounts when the viewport narrows"
    );
    assert.false(
      exists(".d-header .floating-search-input"),
      "core removes its desktop field at the same breakpoint"
    );
  });
});

acceptance(
  "Compara Jogos header search - mobile private messages",
  function (needs) {
    needs.mobileView();
    needs.user();
    needs.settings({
      search_experience: "search_field",
      site_logo_small_url: "/images/small-logo.png",
    });

    needs.pretender((server, helper) => {
      server.get("/topics/private-messages/:username.json", () => {
        return helper.response(
          cloneJSON(
            privateMessagesFixtures["/topics/private-messages/eviltrout.json"]
          )
        );
      });
    });

    test("the PM search context uses the compact mobile layout hook", async function (assert) {
      await visit("/u/eviltrout/messages");
      await click("#cj-header-search-input");

      const searchMenu = document.querySelector(
        ".cj-header-search .search-menu"
      );
      const searchContext = searchMenu.querySelector(".search-context");
      const searchInput = searchMenu.querySelector(".search-term__input");

      /* Theme QUnit intentionally loads core's stylesheet only. Assert the DOM
       * contract consumed by the mobile CSS instead of browser geometry that
       * cannot include the theme declarations in this runner. */

      assert.true(
        searchContext.matches(
          ".d-header .cj-header-search.cj-header-search--mobile .search-input .search-context"
        ),
        "the scope control receives the compact mobile selector"
      );
      assert.true(
        Boolean(searchContext.querySelector(".d-icon-xmark")),
        "the compact clear-context icon remains available"
      );
      assert.true(
        [...searchContext.parentElement.children].indexOf(searchContext) <
          [...searchInput.parentElement.children].indexOf(searchInput),
        "the scope control remains before the input in the search flex row"
      );
    });
  }
);
