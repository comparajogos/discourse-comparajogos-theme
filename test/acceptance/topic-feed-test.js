import { click, currentURL, visit } from "@ember/test-helpers";
import { test } from "qunit";
import { acceptance, exists } from "discourse/tests/helpers/qunit-helpers";

/*
 * Smoke tests for the feed row. The row replaces every core topic-list column
 * through the columns transformer and a stack of ui-kit imports — the failure
 * mode after a core upgrade is a blank or exploded /latest, so what matters is
 * that rows render at all, on both layouts.
 */

acceptance("Compara Jogos topic feed", function () {
  test("discovery renders feed rows in place of the column table", async function (assert) {
    await visit("/latest");

    assert.true(exists(".topic-list.--cj-feed"), "the list is in feed mode");
    assert.true(
      document.querySelectorAll(".cj-feed .cj-feed__title a").length > 1,
      "rows render with linked titles"
    );
    assert.true(
      exists(".cj-feed .cj-feed__byline .avatar"),
      "the byline carries the author avatar"
    );
  });

  test("the card surface opens its topic", async function (assert) {
    await visit("/latest");

    const row = document.querySelector(
      ".topic-list.--cj-feed .topic-list-item"
    );
    const topicLink = row.querySelector(".cj-feed__title a.title");
    const destination = new URL(topicLink.href).pathname;

    await click(row.querySelector(".cj-feed__stats"));

    assert.strictEqual(currentURL(), destination);
  });
});

acceptance("Compara Jogos topic feed - mobile", function (needs) {
  needs.mobileView();

  test("the mobile layout uses the same feed row", async function (assert) {
    await visit("/latest");

    assert.true(
      exists(".topic-list.--cj-feed .cj-feed"),
      "the mobile-layout transformer keeps the custom row"
    );

    const taxonomy = document.querySelector(".cj-feed__taxonomy");
    const taxonomyStyle = getComputedStyle(taxonomy);

    assert.strictEqual(
      taxonomyStyle.flexBasis,
      "100%",
      "category and tags have their own metadata row"
    );
    assert.strictEqual(
      taxonomyStyle.overflowX,
      "auto",
      "many tags stay on one horizontally scrollable row"
    );
  });
});
