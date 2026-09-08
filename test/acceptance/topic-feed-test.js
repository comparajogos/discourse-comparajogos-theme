import { blur, click, currentURL, focus, visit } from "@ember/test-helpers";
import { test } from "qunit";
import sinon from "sinon";
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
  needs.settings({ show_pinned_excerpt_desktop: true });
  /* The first discovery fixture links to topic 11557. Card navigation is a
   * real Ember transition, so let it complete instead of leaving an unhandled
   * topic request pending until QUnit's timeout. */
  needs.pretender((server, helper) => {
    server.get("/latest.json", () => {
      const response = cloneJSON(discoveryFixtures["/latest.json"]);
      response.topic_list.topics[0].excerpt = "A topic with :heart: emoji";
      response.topic_list.topics[0].pinned = true;
      response.topic_list.topics[0].pinned_globally = true;
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

  test("pinned excerpts respect the core display setting", async function (assert) {
    this.siteSettings.show_pinned_excerpt_desktop = false;
    await visit("/latest");
    assert.dom(".cj-feed__excerpt").doesNotExist();
  });

  test("the card surface opens its topic", async function (assert) {
    await visit("/latest");

    const row = document.querySelector(
      ".topic-list.--cj-feed .topic-list-item"
    );
    const topicLink = row.querySelector(".cj-feed__title a.title");
    const topicId = new URL(topicLink.href).pathname.split("/").at(-1);
    const rememberTopic = sinon.spy(
      this.owner.lookup("service:history-store"),
      "set"
    );

    await click(row.querySelector(".cj-feed__stats"));

    assert.true(
      rememberTopic.calledWith("lastTopicIdViewed", Number(topicId)),
      "card navigation records the topic through core's row handler"
    );

    assert.strictEqual(
      currentURL().split("/").at(-1),
      topicId,
      "the row opens the linked topic even when its canonical slug changes"
    );
  });

  test("titles retain heading semantics and keyboard row selection", async function (assert) {
    await visit("/latest");

    const row = document.querySelector(
      ".topic-list.--cj-feed .topic-list-item"
    );
    const title = row.querySelector(".cj-feed__title a.title");

    assert
      .dom(row.querySelector(".cj-feed__title"))
      .hasAttribute("role", "heading");
    assert
      .dom(row.querySelector(".cj-feed__title"))
      .hasAttribute("aria-level", "2");
    await focus(title);
    assert.dom(row).hasClass("selected");
    await blur(title);
    assert.dom(row).doesNotHaveClass("selected");
  });
});

acceptance("Compara Jogos topic feed - core topic details", function (needs) {
  let topicAttributes;

  needs.hooks.beforeEach(() => {
    topicAttributes = {};
  });

  needs.pretender((server, helper) => {
    server.get("/latest.json", () => {
      const response = cloneJSON(discoveryFixtures["/latest.json"]);
      Object.assign(response.topic_list.topics[0], topicAttributes);
      return helper.response(response);
    });
  });

  test("nested topics show the native new-replies dot instead of numbered badges", async function (assert) {
    topicAttributes = {
      is_nested_view: true,
      has_new_replies: true,
      unread_posts: 3,
      unseen: true,
    };
    await visit("/latest");

    const row = document.querySelector(
      ".topic-list.--cj-feed .topic-list-item"
    );
    assert.dom(row.querySelector(".badge.new-replies")).exists();
    assert.dom(row.querySelector(".badge.unread-posts")).doesNotExist();
    assert.dom(row.querySelector(".badge.new-topic")).doesNotExist();
  });

  test("nested topics without new replies have no dot", async function (assert) {
    topicAttributes = { is_nested_view: true, has_new_replies: false };
    await visit("/latest");
    assert
      .dom(".topic-list-item:first-child .badge.new-replies")
      .doesNotExist();
  });

  test("featured destinations and liked-post links remain available", async function (assert) {
    topicAttributes = {
      featured_link: "https://example.com/game",
      liked_post_numbers: [2, 4],
    };
    await visit("/latest");

    const row = document.querySelector(
      ".topic-list.--cj-feed .topic-list-item"
    );
    assert
      .dom(row.querySelector(".topic-featured-link"))
      .hasAttribute("href", "https://example.com/game");
    assert.dom(row.querySelector(".post-actions.likes")).hasText("#2 #4");
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
