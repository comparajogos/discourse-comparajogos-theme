import { visit } from "@ember/test-helpers";
import { test } from "qunit";
import sinon from "sinon";
import { acceptance } from "discourse/tests/helpers/qunit-helpers";

const PROFILE_DATA = {
  collection: [
    {
      slug: "colecao",
      items_aggregate: { aggregate: { count: 111 } },
    },
  ],
  /* Deliberately omit OWN: the collection metric must come from its dedicated
   * query, even when the unordered four-list preview does not contain it. */
  lists: [
    {
      name: "Desejos",
      slug: "desejos",
      type: "WISH",
      items_aggregate: { aggregate: { count: 52 } },
    },
    {
      name: "Trocas com um nome deliberadamente longo",
      slug: "trocas",
      type: "TRADE",
      items_aggregate: { aggregate: { count: 8 } },
    },
  ],
  lists_aggregate: { aggregate: { count: 4 } },
  offers: { aggregate: { count: 2 } },
  lots: { aggregate: { count: 0 } },
  plays: { aggregate: { count: 7 } },
};

const EMPTY_PROFILE_DATA = {
  collection: [],
  lists: [],
  lists_aggregate: { aggregate: { count: 0 } },
  offers: { aggregate: { count: 0 } },
  lots: { aggregate: { count: 0 } },
  plays: { aggregate: { count: 0 } },
};

function stubProfileCatalog({ data = PROFILE_DATA, ok = true } = {}) {
  const original = window.fetch;
  const calls = [];

  sinon.stub(window, "fetch").callsFake((url, options) => {
    if (typeof url !== "string" || !url.includes("/v1/graphql")) {
      return original.call(window, url, options);
    }

    calls.push(JSON.parse(options.body));

    return Promise.resolve({
      ok,
      status: ok ? 200 : 503,
      json: () => Promise.resolve({ data }),
    });
  });

  return calls;
}

acceptance("Compara Jogos profile bridge", function () {
  test("it hands the forum profile off to the matching catalog identity", async function (assert) {
    const calls = stubProfileCatalog();

    await visit("/u/eviltrout/summary");

    assert
      .dom(".cj-profile-bridge--profile")
      .exists("the profile outlet renders the bridge");
    assert
      .dom(".cj-profile-bridge__switch")
      .hasAttribute(
        "href",
        "https://www.comparajogos.com.br/u/eviltrout",
        "the primary action opens the same member in the catalog"
      )
      .includesText(
        "Compara Jogos",
        "the action names the destination instead of repeating profile"
      );
    assert
      .dom('[data-cj-profile-metric="collection"]')
      .includesText(
        "111",
        "the dedicated collection query survives an unordered list preview"
      );
    assert
      .dom('[data-cj-profile-metric="lists"]')
      .includesText(
        "4",
        "the aggregate is not limited by the four-list preview"
      );
    assert.deepEqual(
      [...document.querySelectorAll("[data-cj-profile-metric]")].map(
        (element) => element.dataset.cjProfileMetric
      ),
      ["plays", "collection", "lists", "offers"],
      "headline metrics follow the React profile before commerce metrics"
    );
    assert
      .dom(".cj-profile-bridge__list")
      .exists({ count: 2 }, "the public list destinations remain available");
    assert
      .dom('.cj-profile-bridge__list[href$="/list/trocas"]')
      .hasAttribute(
        "title",
        "Trocas com um nome deliberadamente longo",
        "truncated list names retain their full accessible label"
      );
    assert.strictEqual(
      calls.length,
      1,
      "the profile makes one catalog request"
    );
    assert.true(
      calls[0].query.includes("collection: lists"),
      "the request asks for the collection independently"
    );
    assert.true(
      calls[0].query.includes("type: {_eq: OWN}"),
      "the collection query targets the OWN list"
    );
  });

  test("it shares pending and resolved profile requests", async function (assert) {
    const calls = stubProfileCatalog();
    const catalog = this.container.lookup("service:cj-profile-catalog");

    const [first, second] = await Promise.all([
      catalog.resolve("cached-member"),
      catalog.resolve("cached-member"),
    ]);
    const third = await catalog.resolve("cached-member");

    assert.strictEqual(first, second, "simultaneous consumers share a result");
    assert.strictEqual(second, third, "later consumers use the session cache");
    assert.strictEqual(calls.length, 1, "all consumers share one fetch");
  });

  test("it stays absent when the catalog profile has no public activity", async function (assert) {
    stubProfileCatalog({ data: EMPTY_PROFILE_DATA });

    await visit("/u/eviltrout/summary");

    assert
      .dom(".cj-profile-bridge")
      .doesNotExist(
        "an empty catalog response leaves the native profile alone"
      );
  });

  test("it fails quietly when the catalog is unavailable", async function (assert) {
    stubProfileCatalog({ ok: false });

    await visit("/u/eviltrout/summary");

    assert
      .dom(".cj-profile-bridge")
      .doesNotExist("a catalog outage leaves the native profile usable");
  });
});

acceptance("Compara Jogos profile bridge - mobile", function (needs) {
  needs.mobileView();

  test("it wraps destinations instead of hiding them in an unmarked scroller", async function (assert) {
    stubProfileCatalog();

    await visit("/u/eviltrout/summary");

    assert.strictEqual(
      getComputedStyle(document.querySelector(".cj-profile-bridge__metrics"))
        .flexWrap,
      "wrap",
      "mobile metrics remain visible across rows"
    );
    assert.strictEqual(
      getComputedStyle(document.querySelector(".cj-profile-bridge__list-items"))
        .flexWrap,
      "wrap",
      "mobile list destinations remain visible across rows"
    );
  });
});
