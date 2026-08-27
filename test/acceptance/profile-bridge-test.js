import { click, visit, waitFor } from "@ember/test-helpers";
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
  lists: [
    {
      name: "Coleção",
      slug: "colecao",
      type: "OWN",
      items_aggregate: { aggregate: { count: 111 } },
    },
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
  firstLot: [],
  plays: { aggregate: { count: 7 } },
};

const EMPTY_PROFILE_DATA = {
  collection: [],
  lists: [],
  lists_aggregate: { aggregate: { count: 0 } },
  offers: { aggregate: { count: 0 } },
  lots: { aggregate: { count: 0 } },
  firstLot: [],
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

acceptance("Compara Jogos profile bridge", function (needs) {
  needs.user();

  test("it adds the shared public profile tabs behind the cutover setting", async function (assert) {
    const previous = settings.unified_profile_shell;
    settings.unified_profile_shell = true;
    stubProfileCatalog();

    try {
      await visit("/u/eviltrout/activity");

      assert.true(
        document.body.classList.contains("cj-unified-profile-shell"),
        "the runtime class activates matching navigation styles atomically"
      );
      assert.strictEqual(
        document.querySelectorAll(".cj-user-nav").length,
        3,
        "the connector contributes only the missing React-owned destinations"
      );
      assert.deepEqual(
        [...document.querySelectorAll(".cj-user-nav")].map((element) =>
          element.classList[1].replace("cj-user-nav--", "")
        ),
        ["offers", "lists", "plays"],
        "public product tabs keep the same priority and focus order as React"
      );
      assert
        .dom(".about.collapsed-info #cj-profile-catalog-details")
        .exists(
          "focused forum pages keep catalog facts inside the native disclosure"
        );
      assert
        .dom(".user-profile-toggle-btn")
        .hasAttribute("aria-expanded", "false");
      await waitFor(
        '.user-profile-toggle-btn[aria-controls~="cj-profile-catalog-details"]'
      );
      assert.true(
        document
          .querySelector(".user-profile-toggle-btn")
          .getAttribute("aria-controls")
          .split(/\s+/)
          .includes("cj-profile-catalog-details"),
        "the native disclosure names the catalog facts it controls"
      );

      await click(".user-profile-toggle-btn");

      assert
        .dom(".about:not(.collapsed-info) #cj-profile-catalog-details")
        .exists("the native disclosure expands around catalog facts too");
      assert
        .dom(".user-profile-toggle-btn")
        .hasAttribute("aria-expanded", "true");

      await click(".user-profile-toggle-btn");

      assert
        .dom(".about.collapsed-info #cj-profile-catalog-details")
        .exists(
          "collapsing returns catalog facts to the disclosure's collapsed state"
        );
      assert
        .dom(".cj-user-nav--summary")
        .doesNotExist("the native Summary slot is not duplicated");
      assert
        .dom(".user-nav__summary > a")
        .hasAttribute(
          "href",
          "https://www.comparajogos.com.br/u/eviltrout",
          "the native Summary slot opens the canonical React profile"
        );
      assert
        .dom(".cj-user-nav--plays > a")
        .hasAttribute(
          "href",
          "https://www.comparajogos.com.br/u/eviltrout/plays"
        );
      assert
        .dom(".cj-user-nav--plays .d-icon-cj-ph-regular-play-circle")
        .exists("Partidas uses the same Phosphor PlayCircle as the header");
      assert
        .dom(".cj-user-nav--lists > a")
        .hasAttribute(
          "href",
          "https://www.comparajogos.com.br/u/eviltrout/lists"
        );
      assert
        .dom(".cj-user-nav--lists .d-icon-cj-ph-regular-list-star")
        .exists("Listas uses the same Phosphor ListStar as the header");
      assert
        .dom(".cj-user-nav--offers > a")
        .hasAttribute(
          "href",
          "https://www.comparajogos.com.br/store/eviltrout"
        );
    } finally {
      settings.unified_profile_shell = previous;
    }
  });

  test("it adds neutral catalog facts to the matching forum identity", async function (assert) {
    const calls = stubProfileCatalog();

    await visit("/u/eviltrout/summary");

    assert
      .dom(".cj-profile-bridge--profile")
      .exists("the profile outlet renders the bridge");
    assert
      .dom(".cj-profile-bridge__switcher")
      .doesNotExist("the identity no longer presents two competing profiles");
    assert
      .dom('[data-cj-profile-metric="collection"]')
      .includesText(
        "111",
        "the dedicated collection query survives an unordered list preview"
      );
    assert
      .dom('[data-cj-profile-metric="collection"] .d-icon-cube')
      .exists("collection uses the same Phosphor Cube as React");
    assert
      .dom('[data-cj-profile-metric="plays"] .d-icon-cj-ph-bold-dice-five')
      .exists("play metrics use the shared Phosphor DiceFive");
    assert
      .dom('[data-cj-profile-metric="lists"] .d-icon-list-check')
      .exists("list metrics use the shared Phosphor ListChecks");
    assert
      .dom('[data-cj-profile-metric="lists"]')
      .hasAttribute(
        "href",
        "https://www.comparajogos.com.br/u/eviltrout/lists",
        "the list total opens the member's complete list index"
      )
      .includesText(
        "4",
        "the aggregate is not limited by the two-list preview"
      );
    assert.deepEqual(
      [...document.querySelectorAll("[data-cj-profile-metric]")].map(
        (element) => element.dataset.cjProfileMetric
      ),
      ["offers", "plays", "collection", "lists"],
      "facts follow the same marketplace, play and library order as React"
    );
    assert
      .dom(".cj-profile-bridge__list")
      .doesNotExist(
        "the full profile header does not duplicate list navigation"
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
    assert.true(
      calls[0].query.includes("type: {_neq: OWN}"),
      "the compact card preview excludes the collection"
    );
    assert.true(
      calls[0].query.includes("order_by: [{slug: asc}]"),
      "the compact card shortcuts have deterministic ordering"
    );
    assert.true(
      calls[0].query.includes("firstLot: price"),
      "the auction fact can target the same live auction as React"
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

  test("it sends auction facts to the soonest live auction", async function (assert) {
    stubProfileCatalog({
      data: {
        ...PROFILE_DATA,
        lots: { aggregate: { count: 2 } },
        firstLot: [{ auction: { id: 77 } }],
      },
    });

    await visit("/u/eviltrout/summary");

    assert
      .dom('[data-cj-profile-metric="auctions"]')
      .hasAttribute(
        "href",
        "https://www.comparajogos.com.br/auction/77",
        "the same visible fact has the same destination in both products"
      );
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
  needs.user();
  needs.mobileView();

  test("it keeps focused-page expansion compact", async function (assert) {
    const previous = settings.unified_profile_shell;
    settings.unified_profile_shell = true;
    stubProfileCatalog();

    try {
      await visit("/u/eviltrout/activity");

      assert
        .dom(".about.collapsed-info .primary > .user-profile-avatar")
        .exists("the compact avatar remains in the primary identity row");
      assert
        .dom(".about.collapsed-info .primary > .primary-textual")
        .exists("the member names remain in the primary identity row");
      assert
        .dom(".user-profile-toggle-btn")
        .hasAttribute("aria-expanded", "false");
      await waitFor(
        '.user-profile-toggle-btn[aria-controls~="cj-profile-catalog-details"]'
      );
      assert.true(
        document
          .querySelector(".user-profile-toggle-btn")
          .getAttribute("aria-controls")
          .split(/\s+/)
          .includes("cj-profile-catalog-details"),
        "the compact disclosure controls the catalog facts"
      );

      await click(".user-profile-toggle-btn");

      assert
        .dom(".user-profile-toggle-btn")
        .hasAttribute("aria-expanded", "true");
      assert
        .dom(
          ".about:not(.collapsed-info) #cj-profile-catalog-details .cj-profile-bridge--profile"
        )
        .exists("the compact expansion keeps catalog facts in the disclosure");
    } finally {
      settings.unified_profile_shell = previous;
    }
  });

  test("it keeps headline facts compact and visible", async function (assert) {
    stubProfileCatalog();

    await visit("/u/eviltrout/summary");

    assert.deepEqual(
      [...document.querySelectorAll("[data-cj-profile-metric]")].map(
        (element) => element.dataset.cjProfileMetric
      ),
      ["offers", "plays", "collection", "lists"],
      "all headline destinations remain available in the mobile document flow"
    );
    assert.dom(".cj-profile-bridge__metrics").hasAttribute("aria-label");
  });
});
