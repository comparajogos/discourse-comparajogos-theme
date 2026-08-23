# Compara Jogos Discourse theme

The full Discourse theme for the Compara Jogos community. It maps the React
client's design tokens onto Discourse's public custom properties and depends on
no theme components.

The theme intentionally keeps its CSS surface small. Discourse core owns the
composer, topic posts, form controls, menus, and responsive behavior. The
theme owns product-level color tokens, the shared frame, the header, the
sidebar's row geometry, the page panels, and the discovery feed row.

## Install

In Discourse, open **Admin → Customize → Themes → Install → From a git
repository** and use:

```text
https://github.com/comparajogos/discourse-comparajogos-theme
```

Select **Compara Jogos Light** as the default color scheme and associate
**Compara Jogos Dark** as its dark-mode scheme. In site typography settings,
use **Inter** for base and heading fonts to match the React client exactly.
The theme defaults **Search experience** to **Search field in site header** and
turns the **welcome banner** off, so the header carries the same permanent search
field the React client does — core hides that field while the banner's own search
is on screen, and the catalog has no banner to defer to. Both are themeable site
settings, so they are first-run defaults only: if the setting already has a value
on the site, the theme leaves it alone and admin stays the source of truth.

Optional Compara Jogos components are deliberately not bundled into the base;
validate the base first, then enable the remaining production component set one
at a time.
When installing the Category Carousel or mobile Tab Bar, enable the matching
theme setting as well. Those switches let the first-paint shell reserve the
component's space without making the standalone base theme promise UI that is
not installed.

The theme styles the existing `.cj-header-nav` integration when present. The
underlying Discourse header and navigation still work without it.

Cross-product navigation lives in the header, not in a sidebar card, so there
is exactly one door between the forum and the catalog. Discourse 3.6.0.beta1 or
newer is required for the ui-kit imports the topic feed row uses.

**Uninstall `discourse-tag-game-card`.** Its mention card now ships here; with
both installed a `#tag` mention opens two cards.

**Uninstall `comparajogos-user-list-links`.** Its profile integration now ships
here; with both installed the same catalog activity appears twice.

## Game cards

On this forum a board game _is_ a tag: the tag name is the catalog's product
slug and the tag description is the game's proper name. The theme reads the
catalog's public GraphQL API and shows that game in three places:

- **the tag's topic list** — a card above the list (`game_card_tag_page`);
- **a topic** — a scrollable strip of the games it is filed under, above the
  posts (`game_card_topic_rail`);
- **a `#tag` mention** in a post or chat message — the same card, on tap
  (`game_card_mentions`).

Nothing renders until the catalog answers, and nothing renders for a tag the
catalog does not know as a game. Tags listed in `game_card_ignored_tags` are
never looked up at all; every other tag is looked up once per session and the
answer — game or not — is remembered, so a marker tag costs one request per
visitor. A mention keeps its `href` throughout: unrecognised tags navigate to
the tag page exactly as core renders them, and ctrl/cmd-click still opens a new
tab on a recognised one.

A game renamed in the catalog keeps working. When a tag's slug no longer matches
a product, the theme follows the catalog's own `permalink` table — the same
redirect the client's `/item/<slug>` page uses — and links to the slug it
resolves to.

The API is queried anonymously with `fetch`, never `discourse/lib/ajax`: `ajax`
would fetch a CSRF token and add `X-CSRF-Token` and `Discourse-Script` to a
cross-origin POST, buying a preflight and a wasted round trip for headers the
catalog neither needs nor accepts. Because Pretender patches XMLHttpRequest and
never sees `fetch`, the theme's tests stub `window.fetch` instead.

## Profile bridge

The forum profile surfaces the same member's public Compara Jogos activity:
plays, collection and list totals, active offers, auctions, and links to their
first four lists. The user card keeps the hand-off compact with headline metrics
only. Both surfaces share a session cache and render nothing when the catalog
has no public activity or is unavailable. Disable it with `profile_bridge`.

## Development

```sh
pnpm install
pnpm check:colors
pnpm format:check
pnpm lint:hbs
pnpm lint:styles
pnpm lint:js
```

Use the official `discourse_theme` CLI to sync to a development forum or Theme
Creator. Validate both color schemes in Discourse's Styleguide, then cover at
least `/latest`, `/categories`, one topic, composer, search, user profile,
chat, and the mobile sidebar.

### Colors

`design/colors.json` is the color contract. Edit it, then run:

```sh
pnpm sync:colors
```

The script updates Discourse's light and dark schemes, the loaded theme tokens,
and the inline first-paint shell. Generated values stay committed because a
remote Discourse theme installation does not run repository build scripts. CI
rejects changes when any generated color surface is stale.

## Design contract

- Keep native Discourse semantics and behavior.
- Extend `--cj-*` tokens before adding isolated values.
- Use logical properties for direction-safe spacing.
- Preserve visible focus and reduced-motion handling.
- Never restyle `#reply-control`; composer compatibility belongs to core.
- Test production theme components one at a time after the base passes.

### Token over selector

**Where core exposes a `--d-*` property for something, set the property — never
a rule on the component's class.** Core reaches the same element from several
selectors of different lengths, and a class rule of ours only ever outweighs the
shortest of them. `.btn-primary { background: … }` styled every plain button and
left `#create-topic` painting itself from `--d-button-primary-bg-color`, so the
composer's split button kept the raw accent while everything else moved. Setting
the token instead reaches every path core paints through, inherits into nested
components, and needs no specificity arithmetic.

When there is no token, match core's selector length rather than escalating past
it — the theme's stylesheet loads after core's, so equal specificity wins. Check
which rule actually applies before assuming the value took effect: a token that
resolves correctly on the element proves nothing about which declaration painted
it. `!important` is a last resort for the two cases where core's CSS ships later
in document order than the theme's (see `_splash.scss`).

### One concern per file

`common/common.scss` is the manifest. A file is named for the surface it styles,
so an override can be retired without reading the whole stylesheet, and dead
rules stay visible — a stale block whose component was removed months earlier sat
unnoticed in a 790-line `styles.scss` while silently breaking two other rules.
`styles.scss` is page-level base only; anything with a home goes in its partial,
including that surface's own media queries.
