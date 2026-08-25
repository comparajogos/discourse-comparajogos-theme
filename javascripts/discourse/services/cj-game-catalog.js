import Service from "@ember/service";
import {
  GAMES_QUERY,
  itemPath,
  normalizeGame,
  PERMALINKS_QUERY,
  slugFromItemPath,
} from "../lib/game-catalog";

/**
 * The one owner of catalog network traffic and its caches.
 *
 * Every card surface asks the same question — "is this tag a game, and what is
 * it?" — about overlapping sets of slugs: the tag route asks for one, the topic
 * rail for the topic's tags, and a clicked mention for its tag. Answering that
 * per component would mean one request per card; answering it here means one
 * request per render tick.
 *
 * Three caches, all session-lifetime:
 *
 * - `games` maps a canonical slug to its game.
 * - `missing` remembers slugs proven *not* to be games. This is what makes
 *   failing gracefully cheap: `/tag/ficha` asks once, and every later mention of
 *   `#ficha` is answered without touching the network or the DOM.
 * - `aliases` maps a requested slug to the canonical one the catalog redirected
 *   it to, so a game renamed after its tag was created keeps its card.
 */
export default class CjGameCatalog extends Service {
  #games = new Map();
  #missing = new Set();
  #aliases = new Map();
  #pending = new Map();
  #queue = new Set();
  #scheduled = null;

  /* Tags that are structural rather than games — the data-sheet and image-bank
   * tags, and anything else the site uses as a marker. Skipping them here keeps
   * them out of every request and out of every cache. */
  get ignoredTags() {
    return new Set(
      (settings.game_card_ignored_tags || "")
        .split("|")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    );
  }

  /* A game already known, following a rename. Callers that can render
   * synchronously (the topic rail on a revisit) use this to avoid a frame with
   * no card. */
  cached(slug) {
    const key = this.#key(slug);
    return this.#games.get(this.#aliases.get(key) ?? key) ?? null;
  }

  /**
   * @param {string[]} slugs tag names to look up
   * @returns {Promise<Map<string, object|null>>} keyed by the slug asked for,
   *   never rejecting: an unresolved slug maps to null.
   */
  async resolve(slugs) {
    const wanted = this.#candidates(slugs);
    const waiting = [];

    for (const slug of wanted) {
      if (this.#missing.has(slug) || this.cached(slug)) {
        continue;
      }

      waiting.push(this.#enqueue(slug));
    }

    if (waiting.length) {
      await Promise.all(waiting);
    }

    const resolved = new Map();

    for (const slug of wanted) {
      resolved.set(slug, this.cached(slug));
    }

    return resolved;
  }

  /**
   * The single-slug case, which is most of them.
   *
   * @param {string} slug
   * @returns {Promise<object|null>}
   */
  async resolveOne(slug) {
    try {
      const resolved = await this.resolve([slug]);

      return resolved.get(this.#key(slug)) ?? null;
    } catch {
      /* `resolve` already swallows catalog failures; this is the guard for
       * anything unforeseen, so a card surface can never propagate a rejection
       * into the page it decorates. */
      return null;
    }
  }

  /**
   * The only place this theme talks to the catalog. Kept as one method so tests
   * have a single seam to stub — Pretender patches XMLHttpRequest and does not
   * see `fetch` at all.
   *
   * `fetch` rather than `discourse/lib/ajax`: `ajax` fetches a CSRF token and
   * adds `X-CSRF-Token` and `Discourse-Script` to any non-GET request, which on
   * a cross-origin POST buys a preflight and a wasted round trip for headers the
   * catalog neither needs nor accepts.
   */
  async request(query, variables) {
    const response = await fetch(settings.game_card_graphql_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`catalog responded ${response.status}`);
    }

    return await response.json();
  }

  #key(slug) {
    return String(slug || "")
      .trim()
      .toLowerCase();
  }

  #candidates(slugs) {
    const ignored = this.ignoredTags;

    return [
      ...new Set(
        (slugs || [])
          .map((slug) =>
            this.#key(typeof slug === "string" ? slug : slug?.name)
          )
          .filter((slug) => slug && !ignored.has(slug))
      ),
    ];
  }

  #enqueue(slug) {
    let pending = this.#pending.get(slug);

    if (pending) {
      return pending;
    }

    pending = new Promise((resolve) => {
      this.#queue.add({ slug, resolve });
    });

    this.#pending.set(slug, pending);
    this.#schedule();

    return pending;
  }

  /* A microtask, not a timer: components that render in the same tick share one
   * request, and nothing waits longer than it has to. */
  #schedule() {
    if (this.#scheduled) {
      return;
    }

    this.#scheduled = Promise.resolve().then(() => {
      this.#scheduled = null;
      return this.#flush();
    });
  }

  async #flush() {
    const batch = [...this.#queue];
    this.#queue.clear();

    if (!batch.length) {
      return;
    }

    const slugs = batch.map(({ slug }) => slug);

    try {
      const unresolved = await this.#loadGames(slugs);

      if (unresolved.length) {
        await this.#loadRenamed(unresolved);
      }
    } catch {
      /* A blip is not an answer. Leave the caches untouched so the next page
       * view retries, and let every card in this batch render nothing. */
    } finally {
      batch.forEach(({ slug, resolve }) => {
        this.#pending.delete(slug);
        resolve();
      });
    }
  }

  /* Records what came back and returns the slugs that did not. */
  async #loadGames(slugs) {
    const { data } = await this.request(GAMES_QUERY, { slugs });
    const found = new Set();

    (data?.product_price || []).forEach((row) => {
      const game = normalizeGame(row);

      if (game) {
        this.#games.set(game.slug, game);
        found.add(game.slug);
      }
    });

    return slugs.filter((slug) => !found.has(slug));
  }

  /* Slugs the catalog no longer knows may still be reachable through its
   * permalink table. Whatever the table cannot place is a non-game, and is
   * remembered as such. */
  async #loadRenamed(slugs) {
    const { data } = await this.request(PERMALINKS_QUERY, {
      paths: slugs.map(itemPath),
    });

    const canonical = new Set();

    (data?.permalink || []).forEach((entry) => {
      const from = slugFromItemPath(entry.path || "");
      const to = entry.product?.slug;

      if (from && to) {
        this.#aliases.set(from, to);
        canonical.add(to);
      }
    });

    slugs
      .filter((slug) => !this.#aliases.has(slug))
      .forEach((slug) => this.#missing.add(slug));

    if (!canonical.size) {
      return;
    }

    const stillUnresolved = await this.#loadGames([...canonical]);

    /* A permalink pointing at a product the price view does not carry is as good
     * as no game; drop the alias so the slug is not looked up again. */
    stillUnresolved.forEach((slug) => {
      for (const [from, to] of this.#aliases) {
        if (to === slug) {
          this.#aliases.delete(from);
          this.#missing.add(from);
        }
      }
    });
  }
}
