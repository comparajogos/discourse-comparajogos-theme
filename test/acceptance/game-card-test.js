import { click, currentURL, fillIn, visit, waitFor } from "@ember/test-helpers";
import { test } from "qunit";
import sinon from "sinon";
import { cloneJSON } from "discourse/lib/object";
import topicFixtures from "discourse/tests/fixtures/topic";
import { acceptance } from "discourse/tests/helpers/qunit-helpers";

/*
 * The game cards read a third-party GraphQL API with `fetch`, which Pretender
 * does not intercept — it patches XMLHttpRequest only. Stubbing `window.fetch`
 * covers that gap and exercises the service's own request building (URL, method,
 * body) rather than mocking it away. Anything that is not the catalog falls
 * through to the real `fetch`, so an unrelated request in the app is unaffected.
 *
 * `sinon.restore()` runs in Discourse's own test teardown.
 */
function stubCatalog(games, { renames = {} } = {}) {
  const original = window.fetch;
  const calls = [];

  sinon.stub(window, "fetch").callsFake((url, options) => {
    if (typeof url !== "string" || !url.includes("/v1/graphql")) {
      return original.call(window, url, options);
    }

    const { query, variables } = JSON.parse(options.body);
    calls.push({ query, variables });

    const data = query.includes("permalink")
      ? {
          permalink: variables.paths
            .filter((path) => renames[path])
            .map((path) => ({
              path,
              product: { slug: renames[path] },
            })),
        }
      : {
          product_price: variables.slugs
            .filter((slug) => games[slug])
            .map((slug) => games[slug]),
        };

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data }),
    });
  });

  return calls;
}

function priceRow(product, prices = {}) {
  return {
    min_price_new: null,
    min_price_used: null,
    new_count: 0,
    used_count: 0,
    available: false,
    ...prices,
    product,
  };
}

/* Shapes lifted from live responses, including the unrounded BGG figures the
 * card has to format. */
const BRASS = priceRow(
  {
    slug: "brass-birmingham",
    name: "Brass: Birmingham",
    year: 2025,
    type: "game",
    playing_time: 120,
    min_playtime: 60,
    max_playtime: 120,
    min_players: 2,
    max_players: 4,
    thumbnail_url: "/images/brass.jpg",
    bgg_rating: 8.5943,
    bgg_ranking: 1,
    bgg_weight: 3.9081,
    recommended_players: ["2", "3", "4"],
    best_players: ["3", "4"],
    publisher: { name: "Roxley" },
  },
  {
    min_price_new: 743.91,
    min_price_used: 679,
    new_count: 6,
    used_count: 1,
    available: true,
  }
);

const GI_JOE = priceRow({
  slug: "gi-joe-mission-critical",
  name: "G.I. JOE Mission Critical",
  year: 2022,
  type: "game",
  playing_time: 75,
  min_playtime: 50,
  max_playtime: 75,
  min_players: 1,
  max_players: 5,
  thumbnail_url: "/images/gijoe.jpg",
  bgg_rating: 7.49756,
  bgg_ranking: 9172,
  bgg_weight: 2.2222,
  recommended_players: ["1", "3", "4", "5"],
  best_players: ["1"],
  publisher: { name: "Renegade Game Studios" },
});

function tagList(id, name, description) {
  return {
    users: [],
    primary_groups: [],
    topic_list: {
      can_create_topic: false,
      draft_key: "new_topic",
      topics: [],
      tags: [{ id, name, slug: name, description, topic_count: 1 }],
    },
  };
}

function mention(slug, label) {
  return `<a class="hashtag-cooked" href="/tag/${slug}" data-type="tag" data-slug="${slug}"><span>${label}</span></a>`;
}

function topicWithGameTags() {
  const topic = cloneJSON(topicFixtures["/t/280/1.json"]);

  topic.tags = [
    { id: 7, name: "gi-joe-mission-critical" },
    { id: 8, name: "ficha" },
  ];
  topic.tags_descriptions = {
    "gi-joe-mission-critical": "G.I. JOE Mission Critical",
    ficha: "Data sheet",
  };
  topic.post_stream.posts[0].cooked =
    `<p>Comparing ${mention("gi-joe-mission-critical", "gi-joe")} against the ` +
    `${mention("ficha", "ficha")} marker.</p>`;

  return topic;
}

acceptance("Compara Jogos game card - tag page", function (needs) {
  needs.settings({ tagging_enabled: true });

  needs.pretender((server, helper) => {
    server.get("/tag/7/l/latest.json", () =>
      helper.response(tagList(7, "brass-birmingham", "Brass: Birmingham"))
    );
    server.get("/tag/8/l/latest.json", () =>
      helper.response(tagList(8, "ficha", "Data sheet"))
    );
    server.get("/tag/9/l/latest.json", () =>
      helper.response(tagList(9, "brass", "Brass: Birmingham"))
    );
  });

  test("a game tag gets its card above the topic list", async function (assert) {
    stubCatalog({ "brass-birmingham": BRASS });

    await visit("/tag/brass-birmingham/7");

    assert
      .dom(".cj-game-card-panel .cj-game-card__name")
      .hasText("Brass: Birmingham", "the card carries the game's proper name");
    assert
      .dom(".cj-game-card-panel .cj-game-card__name")
      .hasAttribute(
        "href",
        "https://www.comparajogos.com.br/item/brass-birmingham",
        "the name links to the catalog item"
      );
    assert
      .dom(".cj-game-card-panel .cj-game-card__stat")
      .exists(
        { count: 4 },
        "all four figures render when the catalog has them"
      );
    assert
      .dom(".cj-game-card-panel .cj-game-card__price-offer.--new")
      .exists("the cheapest new offer is shown");
    assert
      .dom(".cj-game-card-panel .cj-game-card__player-group.--best")
      .exists({ count: 1 }, "consecutive best counts collapse into one range");
  });

  test("a tag that is not a game is left alone", async function (assert) {
    const calls = stubCatalog({});

    await visit("/tag/ficha/8");

    assert
      .dom(".cj-game-card-panel")
      .doesNotExist("no card is rendered for a marker tag");
    assert.deepEqual(
      calls,
      [],
      "an ignored tag is never looked up in the catalog"
    );
  });

  test("a renamed game is followed through the catalog's permalinks", async function (assert) {
    const calls = stubCatalog(
      { "brass-birmingham": BRASS },
      { renames: { "/item/brass": "brass-birmingham" } }
    );

    await visit("/tag/brass/9");

    assert
      .dom(".cj-game-card-panel .cj-game-card__name")
      .hasText("Brass: Birmingham", "the card resolves through the old slug");
    assert
      .dom(".cj-game-card-panel .cj-game-card__name")
      .hasAttribute(
        "href",
        "https://www.comparajogos.com.br/item/brass-birmingham",
        "links use the slug the catalog redirected to"
      );
    assert.true(
      calls.some(({ query }) => query.includes("permalink")),
      "the permalink table is consulted only after the direct lookup misses"
    );
  });
});

acceptance("Compara Jogos game card - topic", function (needs) {
  needs.user();
  needs.settings({ rich_editor: true, tagging_enabled: true });

  needs.pretender((server, helper) => {
    server.get("/t/280.json", () => helper.response(topicWithGameTags()));
    server.get("/t/280/:post_number.json", () =>
      helper.response(topicWithGameTags())
    );

    /* A cooked mention links to `/tag/<slug>`, which core resolves to its
     * canonical `/tag/<slug>/<id>` through `info.json`. The default test stub
     * echoes the slug back as the id, and a non-numeric id sends the route
     * redirecting to itself forever — so this returns a real numeric one, as a
     * forum does. */
    server.get("/tag/ficha/info.json", () =>
      helper.response({
        tag_info: {
          id: 8,
          name: "ficha",
          slug: "ficha",
          topic_count: 1,
          staff: false,
          synonyms: [],
          tag_group_names: [],
          category_ids: [],
        },
        categories: [],
      })
    );
    server.get("/tag/8/l/latest.json", () =>
      helper.response(tagList(8, "ficha", "Data sheet"))
    );
    server.get("/tag/8/notifications.json", () =>
      helper.response({
        tag_notification: {
          id: 8,
          name: "ficha",
          notification_level: 1,
        },
      })
    );
    server.get("/hashtags", () =>
      helper.response({
        tags: [
          {
            type: "tag",
            ref: "gi-joe-mission-critical",
            icon: "tag",
            id: 7,
          },
          { type: "tag", ref: "ficha", icon: "tag", id: 8 },
        ],
      })
    );
  });

  test("the rail lists the topic's games and skips its marker tags", async function (assert) {
    stubCatalog({ "gi-joe-mission-critical": GI_JOE });

    await visit("/t/internationalization-localization/280");

    assert
      .dom(".cj-game-rail .cj-game-mini")
      .exists({ count: 1 }, "one chip per game tag, and none for `ficha`");
    assert
      .dom(".cj-game-rail .cj-game-mini__name")
      .hasText("G.I. JOE Mission Critical");
    assert
      .dom(".cj-game-rail .cj-game-mini__unavailable")
      .exists("a game nobody is selling says so rather than showing a gap");
  });

  test("tapping a game mention opens its card", async function (assert) {
    stubCatalog({ "gi-joe-mission-critical": GI_JOE });

    await visit("/t/internationalization-localization/280");

    assert
      .dom('.cooked .hashtag-cooked[data-slug="gi-joe-mission-critical"]')
      .hasAttribute(
        "href",
        "/tag/gi-joe-mission-critical",
        "the general handler leaves the cooked link intact"
      );

    await click('.cooked .hashtag-cooked[data-slug="gi-joe-mission-critical"]');
    await waitFor(
      '.fk-d-menu[data-identifier="cj-game-card"] .cj-game-card__name'
    );

    assert
      .dom('.fk-d-menu[data-identifier="cj-game-card"] .cj-game-card__name')
      .hasText("G.I. JOE Mission Critical", "the card opens in place");
    assert
      .dom('.fk-d-menu[data-identifier="cj-game-card"] .cj-game-card__action')
      .exists({ count: 2 }, "the popup offers the catalog and the tag page");
  });

  test("tapping a game mention in the post preview opens its card", async function (assert) {
    stubCatalog({ "gi-joe-mission-critical": GI_JOE });

    await visit("/t/internationalization-localization/280");
    await click("#topic-footer-buttons .create");
    await fillIn(
      "#reply-control .d-editor-input",
      "Previewing #gi-joe-mission-critical"
    );

    if (!document.querySelector("#reply-control.show-preview")) {
      await click("#reply-control .toggle-preview");
    }

    await waitFor(
      '#reply-control .d-editor-preview .hashtag-cooked[data-slug="gi-joe-mission-critical"]'
    );

    await click(
      '#reply-control .d-editor-preview .hashtag-cooked[data-slug="gi-joe-mission-critical"]'
    );
    await waitFor(
      '.fk-d-menu[data-identifier="cj-game-card"] .cj-game-card__name'
    );

    assert
      .dom('.fk-d-menu[data-identifier="cj-game-card"] .cj-game-card__name')
      .hasText(
        "G.I. JOE Mission Critical",
        "the preview uses the same handler"
      );
  });

  test("tapping a game mention in the rich editor opens its card", async function (assert) {
    stubCatalog({ "gi-joe-mission-critical": GI_JOE });

    await visit("/t/internationalization-localization/280");
    await click("#topic-footer-buttons .create");
    await fillIn(
      "#reply-control .d-editor-input",
      "Comparing #gi-joe-mission-critical with #ficha"
    );
    await click(".composer-toggle-switch");
    await waitFor(
      '.ProseMirror .hashtag-cooked[data-name="gi-joe-mission-critical"][data-processed="true"]'
    );

    await click('.ProseMirror .hashtag-cooked[data-name="ficha"]');

    assert
      .dom('.fk-d-menu[data-identifier="cj-game-card"]')
      .doesNotExist("a non-game editor mention leaves the editor alone");

    await click(
      '.ProseMirror .hashtag-cooked[data-name="gi-joe-mission-critical"]'
    );
    await waitFor(
      '.fk-d-menu[data-identifier="cj-game-card"] .cj-game-card__name'
    );

    assert
      .dom('.fk-d-menu[data-identifier="cj-game-card"] .cj-game-card__name')
      .hasText("G.I. JOE Mission Critical", "the card opens while composing");
  });

  test("a mention that is not a game keeps its link", async function (assert) {
    stubCatalog({ "gi-joe-mission-critical": GI_JOE });

    await visit("/t/internationalization-localization/280");

    assert
      .dom('.cooked .hashtag-cooked[data-slug="ficha"]')
      .hasAttribute("href", "/tag/ficha", "the original tag link is present");

    await click('.cooked .hashtag-cooked[data-slug="ficha"]');

    assert.strictEqual(
      currentURL(),
      "/tag/ficha/8",
      "it navigates to the tag as core intends"
    );
    assert
      .dom('.fk-d-menu[data-identifier="cj-game-card"]')
      .doesNotExist("and no card is opened");
  });
});
