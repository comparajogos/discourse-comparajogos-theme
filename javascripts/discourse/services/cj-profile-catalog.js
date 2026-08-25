import Service from "@ember/service";

/*
 * The profile and user-card outlets can render the same member at once. Keep
 * their anonymous catalog lookup in one session cache so opening the card after
 * visiting the profile never repeats the GraphQL request.
 */

const PROFILE_QUERY = `query forumProfileSummary($username: String!) {
  collection: lists(
    where: {
      user: {username: {_eq: $username}}
      type: {_eq: OWN}
    }
    limit: 1
  ) {
    slug
    items_aggregate {
      aggregate {
        count
      }
    }
  }
  lists(
    where: {
      user: {username: {_eq: $username}}
      type: {_neq: OWN}
    }
    order_by: [{slug: asc}]
    limit: 2
  ) {
    name
    slug
    type
    items_aggregate {
      aggregate {
        count
      }
    }
  }
  lists_aggregate(where: {user: {username: {_eq: $username}}}) {
    aggregate {
      count
    }
  }
  offers: price_aggregate(where: {
    seller: {username: {_eq: $username}}
    type: {_neq: LOT}
    available: {_eq: true}
    active: {_eq: true}
    deleted: {_neq: true}
    product_id: {_neq: 0}
  }) {
    aggregate {
      count
    }
  }
  lots: price_aggregate(where: {
    seller: {username: {_eq: $username}}
    type: {_eq: LOT}
    available: {_eq: true}
    active: {_eq: true}
    deleted: {_neq: true}
    auction: {status: {_eq: ACTIVE}}
  }) {
    aggregate {
      count
    }
  }
  firstLot: price(
    where: {
      seller: {username: {_eq: $username}}
      type: {_eq: LOT}
      available: {_eq: true}
      active: {_eq: true}
      deleted: {_neq: true}
      auction: {status: {_eq: ACTIVE}}
    }
    order_by: [{auction: {end_date: asc}}]
    limit: 1
  ) {
    auction {
      id
    }
  }
  plays: play_aggregate(where: {user: {username: {_eq: $username}}}) {
    aggregate {
      count
    }
  }
}`;

const LIST_ICONS = {
  OWN: "check",
  TRADE: "right-left",
  WISH: "star",
};

const aggregateCount = (aggregate) => aggregate?.aggregate?.count ?? 0;

export default class CjProfileCatalog extends Service {
  #profiles = new Map();
  #missing = new Set();
  #pending = new Map();

  async resolve(username) {
    const key = String(username || "").trim();

    if (!key || this.#missing.has(key)) {
      return null;
    }

    if (this.#profiles.has(key)) {
      return this.#profiles.get(key);
    }

    if (this.#pending.has(key)) {
      return await this.#pending.get(key);
    }

    const pending = this.#load(key);
    this.#pending.set(key, pending);

    try {
      return await pending;
    } finally {
      this.#pending.delete(key);
    }
  }

  async #load(username) {
    try {
      const response = await fetch(settings.game_card_graphql_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: PROFILE_QUERY,
          variables: { username },
        }),
      });

      if (!response.ok) {
        throw new Error(`catalog responded ${response.status}`);
      }

      const payload = await response.json();

      if (payload.errors?.length || !payload.data) {
        throw new Error("catalog returned an invalid profile response");
      }

      const profile = this.#normalize(username, payload.data);

      if (!profile) {
        this.#missing.add(username);
        return null;
      }

      this.#profiles.set(username, profile);
      return profile;
    } catch {
      /* A catalog outage must not break a Discourse profile. Do not cache the
       * failure: navigating back later should get another chance. */
      return null;
    }
  }

  #normalize(username, data) {
    const product = (settings.product_url || "").replace(/\/$/, "");

    if (!product) {
      return null;
    }

    const profileUrl = `${product}/u/${username}`;
    const lists = (data.lists || [])
      .filter((list) => list.type !== "OWN")
      .slice(0, 2)
      .map((list) => ({
        count: aggregateCount(list.items_aggregate),
        href: `${profileUrl}/list/${list.slug}`,
        icon: LIST_ICONS[list.type] ?? "eye",
        name: list.name,
        type: list.type,
      }));
    const listCount = aggregateCount(data.lists_aggregate);
    const collection = data.collection?.[0];
    const offers = aggregateCount(data.offers);
    const lots = aggregateCount(data.lots);
    const firstAuctionId = data.firstLot?.[0]?.auction?.id;
    const plays = aggregateCount(data.plays);

    /* This anonymous query cannot distinguish an unknown catalog username from
     * a real account with no public activity. Match the old component's privacy
     * boundary and stay absent in both cases. */
    if (!listCount && !offers && !lots && !plays) {
      return null;
    }

    const headlineMetrics = [
      {
        count: plays,
        href: `${profileUrl}/plays`,
        icon: "cj-ph-bold-dice-five",
        key: "plays",
        labelKey: "profile_bridge.metric.plays",
      },
      {
        count: aggregateCount(collection?.items_aggregate),
        href: collection?.slug ? `${profileUrl}/list/${collection.slug}` : null,
        icon: "cube",
        key: "collection",
        labelKey: "profile_bridge.metric.collection",
      },
      {
        count: listCount,
        href: `${profileUrl}/lists`,
        icon: "list-check",
        key: "lists",
        labelKey: "profile_bridge.metric.lists",
      },
    ].filter((metric) => metric.count > 0 && metric.href);

    const commerceMetrics = [
      {
        count: offers,
        href: `${product}/store/${username}`,
        icon: "tag",
        key: "offers",
        labelKey: "profile_bridge.metric.offers",
      },
      {
        count: lots,
        href: firstAuctionId
          ? `${product}/auction/${firstAuctionId}`
          : profileUrl,
        icon: "gavel",
        key: "auctions",
        labelKey: "profile_bridge.metric.auctions",
      },
    ].filter((metric) => metric.count > 0 && metric.href);

    return {
      cardMetrics: headlineMetrics,
      listCount,
      lists,
      listsUrl: `${profileUrl}/lists`,
      metrics: [...commerceMetrics, ...headlineMetrics],
      profileUrl,
    };
  }
}
