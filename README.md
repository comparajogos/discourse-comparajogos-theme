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

Comparajogos components are deliberately not bundled into the base; validate
the base first, then enable the production component set one at a time.

The theme styles the existing `.cj-header-nav` integration when present. The
underlying Discourse header and navigation still work without it.

Cross-product navigation lives in the header, not in a sidebar card, so there
is exactly one door between the forum and the catalog. Discourse 3.6.0.beta1 or
newer is required for the ui-kit imports the topic feed row uses.

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
- Prefer Discourse's own custom properties over component selectors.
- Extend `--cj-*` tokens before adding isolated values.
- Use logical properties for direction-safe spacing.
- Preserve visible focus and reduced-motion handling.
- Never restyle `#reply-control`; composer compatibility belongs to core.
- Test production theme components one at a time after the base passes.
