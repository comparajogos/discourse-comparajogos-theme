import { visit } from "@ember/test-helpers";
import { test } from "qunit";
import { acceptance, exists } from "discourse/tests/helpers/qunit-helpers";

acceptance("Compara Jogos header nav", function () {
  test("it renders the cross-product navigation in the header", async function (assert) {
    await visit("/latest");

    assert.true(exists(".d-header .cj-header-nav"));
    assert.true(
      exists('.cj-header-nav .cj-nav-item[data-cj-nav="forum"].active'),
      "the forum link is current while browsing discovery"
    );
  });

  test("catalog links ask anonymous visitors to sign in first", async function (assert) {
    await visit("/latest");

    const lists = document.querySelector('[data-cj-nav="lists"]');

    assert.true(
      lists.classList.contains("requires-auth"),
      "the link is marked as needing an account"
    );
    assert.true(
      lists.getAttribute("href").endsWith("/login"),
      "it points at sign-in rather than a catalog page it cannot personalise"
    );
  });
});

acceptance("Compara Jogos header nav - mobile", function (needs) {
  needs.mobileView();

  test("it keeps only Meu Comércio in the compact header", async function (assert) {
    await visit("/latest");

    assert
      .dom('.cj-header-nav .cj-nav-item[data-cj-nav="market"]')
      .isVisible("the market remains available beside search");
    assert
      .dom('.cj-header-nav .cj-nav-item[data-cj-nav="forum"]')
      .isNotVisible("destinations owned by the bottom bar stay out of the row");
  });
});
