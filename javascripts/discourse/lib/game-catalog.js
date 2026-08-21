import I18n from "discourse-i18n";

/* The catalog's public GraphQL API, read anonymously. One document for a batch
 * of slugs, because every surface resolves a set: the tag route asks for one,
 * the topic rail asks for the topic's tags, and a post decoration asks for
 * every mention it just cooked. */

export const GAMES_QUERY = `query games($slugs: [String!]) {
  product_price(where: { product: { slug: { _in: $slugs } } }) {
    min_price_new
    min_price_used
    new_count
    used_count
    available
    product {
      slug
      name
      year
      type
      playing_time
      min_playtime
      max_playtime
      min_players
      max_players
      thumbnail_url
      bgg_rating
      bgg_ranking
      bgg_weight
      recommended_players
      best_players
      publisher {
        name
      }
    }
  }
}`;

/* A game renamed in the catalog keeps its old path in `permalink`, which is how
 * the client redirects `/item/<old-slug>` (client/pages/item/[...slug].tsx).
 * A Discourse tag carries whatever slug it was created with, so without this a
 * rename would silently retire the tag's card. */

export const PERMALINKS_QUERY = `query permalinks($paths: [String!]) {
  permalink(where: { path: { _in: $paths } }) {
    path
    product {
      slug
    }
  }
}`;

export const ITEM_PATH_PREFIX = "/item";

export function itemPath(slug) {
  return `${ITEM_PATH_PREFIX}/${slug}`;
}

/* The catalog and the forum are one product, so an item link is an ordinary
 * same-tab link — the same treatment cj-header-nav gives its catalog links. */
export function catalogItemUrl(slug) {
  return `${(settings.product_url || "").replace(/\/$/, "")}${itemPath(slug)}`;
}

export function slugFromItemPath(path) {
  return path.startsWith(`${ITEM_PATH_PREFIX}/`)
    ? path.slice(ITEM_PATH_PREFIX.length + 1)
    : null;
}

/* The API nests the game under its price row; every consumer wants one flat
 * object, and wants the price fields alongside the game fields. */
export function normalizeGame(row) {
  const product = row?.product;

  if (!product?.slug) {
    return null;
  }

  return {
    slug: product.slug,
    name: product.name,
    year: product.year,
    type: product.type,
    thumbnailUrl: product.thumbnail_url,
    publisher: product.publisher?.name,
    ranking: product.bgg_ranking,
    rating: product.bgg_rating,
    weight: product.bgg_weight,
    minPlayers: product.min_players,
    maxPlayers: product.max_players,
    minPlaytime: product.min_playtime,
    maxPlaytime: product.max_playtime,
    playingTime: product.playing_time,
    bestPlayers: product.best_players,
    recommendedPlayers: product.recommended_players,
    available: row.available,
    minPriceNew: row.min_price_new,
    minPriceUsed: row.min_price_used,
    newCount: row.new_count,
    usedCount: row.used_count,
  };
}

/* Formatters are cached per locale: Intl.NumberFormat construction is the
 * expensive half, and a rail of cards formats the same shapes repeatedly. */
const formatters = new Map();

function formatter(key, build) {
  const cacheKey = `${I18n.currentBcp47Locale}:${key}`;
  let cached = formatters.get(cacheKey);

  if (!cached) {
    cached = build(I18n.currentBcp47Locale);
    formatters.set(cacheKey, cached);
  }

  return cached;
}

/* Split rather than formatted whole: the client sets the cents as a superscript
 * beside a large integer, and that needs the parts separately. Going through
 * Intl rather than splitting the number's own string is what gets the thousands
 * separator right — the previous implementation rendered 1234.5 as "1234,5". */
export function currencyParts(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  const parts = formatter(
    "currency",
    (locale) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
  ).formatToParts(Number(value));

  const pick = (types) =>
    parts
      .filter((part) => types.includes(part.type))
      .map((part) => part.value)
      .join("");

  return {
    currency: pick(["currency"]).trim(),
    integer: pick(["integer", "group"]),
    fraction: pick(["decimal", "fraction"]),
  };
}

export function formatDecimal(value, places = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  return formatter(
    `decimal:${places}`,
    (locale) =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: places,
        maximumFractionDigits: places,
      })
  ).format(Number(value));
}

export function formatInteger(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  /* No grouping: every integer on a card is either small enough never to need
   * it (player counts, minutes) or a year, and "2.022" is not a year. */
  return formatter(
    "integer",
    (locale) =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
        useGrouping: false,
      })
  ).format(Number(value));
}

function range(min, max) {
  if (!min && !max) {
    return null;
  }

  if (!max || min === max) {
    return formatInteger(min ?? max);
  }

  if (!min) {
    return formatInteger(max);
  }

  return `${formatInteger(min)}-${formatInteger(max)}`;
}

export function playerRange(game) {
  return range(game.minPlayers, game.maxPlayers);
}

/* `playing_time` is BGG's single headline figure; it is the honest answer when
 * the min/max pair is absent, and the client falls back to it the same way. */
export function playtimeRange(game) {
  return (
    range(game.minPlaytime, game.maxPlaytime) ?? formatInteger(game.playingTime)
  );
}

/* Ported from the client's lib/sortedGroups.ts. Consecutive counts sharing a
 * recommendation collapse into one range, so a 1-5 player game reads
 * "1 | 2-4 | 5" rather than five separate pills. */
export function playerGroups(bestPlayers, recommendedPlayers) {
  const isBest = {};

  bestPlayers?.forEach((count) => (isBest[count] = true));
  recommendedPlayers?.forEach((count) => (isBest[count] ??= false));

  /* Numeric order, with any "6+"-style open-ended count last. */
  const counts = Object.keys(isBest).sort((a, b) => {
    if (a.includes("+")) {
      return 1;
    }
    if (b.includes("+")) {
      return -1;
    }
    return parseInt(a, 10) - parseInt(b, 10);
  });

  const groups = [];
  let current = null;

  const flush = () => {
    if (current) {
      groups.push({
        best: current.best,
        range:
          current.start === current.end
            ? current.start
            : `${current.start}-${current.end}`,
      });
      current = null;
    }
  };

  counts.forEach((count, index) => {
    const best = isBest[count];
    const next = counts[index + 1];
    const sequenceBroken =
      !count.includes("+") &&
      next &&
      !next.includes("+") &&
      parseInt(next, 10) !== parseInt(count, 10) + 1;

    if (!current || current.best !== best || sequenceBroken) {
      flush();
      current = { best, start: count, end: count };
    } else {
      current.end = count;
    }

    /* An open-ended count ends its group: nothing follows it to extend. */
    if (count.includes("+")) {
      flush();
    }
  });

  flush();

  return groups;
}
