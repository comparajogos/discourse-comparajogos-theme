import { click, currentURL, visit } from "@ember/test-helpers";
import { test } from "qunit";
import { cloneJSON } from "discourse/lib/object";
import discoveryFixtures from "discourse/tests/fixtures/discovery-fixtures";
import privateMessagesFixtures from "discourse/tests/fixtures/private-messages-fixtures";
import topicFixtures from "discourse/tests/fixtures/topic";
import { acceptance, exists } from "discourse/tests/helpers/qunit-helpers";

/*
 * Smoke tests for the feed row. The row replaces every core topic-list column
 * through the columns transformer and a stack of ui-kit imports — the failure
 * mode after a core upgrade is a blank or exploded /latest, so what matters is
 * that rows render at all, on both layouts.
 */

acceptance("Compara Jogos topic feed", function (needs) {
  /* The first discovery fixture links to topic 11557. Card navigation is a
   * real Ember transition, so let it complete instead of leaving an unhandled
   * topic request pending until QUnit's timeout. */
  needs.pretender((server, helper) => {
    server.get("/latest.json", () => {
      const response = cloneJSON(discoveryFixtures["/latest.json"]);
      response.topic_list.topics[0].excerpt = "A topic with :heart: emoji";
      return helper.response(response);
    });

    const responseTopic = () => {
      const topic = cloneJSON(topicFixtures["/t/130.json"]);
      topic.id = 11557;
      return helper.response(topic);
    };

    server.get("/t/11557.json", responseTopic);
    server.get("/t/11557/:post_number.json", responseTopic);
  });

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

  test("topic excerpts restore cooked emoji", async function (assert) {
    await visit("/latest");

    assert
      .dom(".cj-feed__excerpt img.emoji")
      .exists("the excerpt uses Discourse's emoji-aware rendering path");
  });

  test("the card surface opens its topic", async function (assert) {
    await visit("/latest");

    const row = document.querySelector(
      ".topic-list.--cj-feed .topic-list-item"
    );
    const topicLink = row.querySelector(".cj-feed__title a.title");
    const topicId = new URL(topicLink.href).pathname.split("/").at(-1);

    await click(row.querySelector(".cj-feed__stats"));

    assert.strictEqual(
      currentURL().split("/").at(-1),
      topicId,
      "the row opens the linked topic even when its canonical slug changes"
    );
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

    assert.true(
      exists(".cj-feed__byline > .cj-feed__taxonomy"),
      "category and tags stay grouped in their dedicated metadata region"
    );
  });
});

acceptance("Compara Jogos topic feed - private messages", function (needs) {
  needs.user();

  needs.pretender((server, helper) => {
    server.get("/topics/private-messages/:username.json", () => {
      return helper.response(
        cloneJSON(
          privateMessagesFixtures["/topics/private-messages/eviltrout.json"]
        )
      );
    });
  });

  test("messages retain the native participant list", async function (assert) {
    await visit("/u/eviltrout/messages");

    assert
      .dom(".topic-list")
      .doesNotHaveClass("--cj-feed", "PMs do not use public feed rows");
    assert
      .dom(".topic-list-item .main-link")
      .exists("the native PM topic cell remains");
    assert
      .dom(".topic-list-item .posters .avatar")
      .exists("the PM participant avatar remains visible");
  });
});
