# Compara Jogos Discourse theme

The full Discourse theme for the Compara Jogos community. It translates the
React client in `client/` into upgrade-conscious Discourse styling: the same
floating product header, Inter typography, neutral surfaces, blue controls,
responsive density, dark scheme, and mobile safe-area behavior.

## Install

In Discourse, open **Admin → Customize → Themes → Install → From a git
repository** and use:

```text
https://github.com/comparajogos/discourse-comparajogos-theme
```

Select **Compara Jogos Light** as the default color scheme and associate
**Compara Jogos Dark** as its dark-mode scheme. In site typography settings,
use **Inter** for base and heading fonts to match the React client exactly.

The theme intentionally styles the existing `.cj-header-nav` integration and
the `discourse-tab-bar-theme` mobile component. Those integrations remain
optional: the underlying Discourse header and navigation still work without
them.

It also uses Discourse's 2026 Blocks API for a small `sidebar-discovery`
product bridge. The block is route-safe, localized, configurable, and can be
disabled with the `show_product_bridge` theme setting. Native topic and post
surfaces are deliberately not replaced by Blocks. Discourse 3.6.0.beta1 or
newer is required.

## Development

```sh
pnpm install
pnpm format:check
pnpm lint:hbs
pnpm lint:styles
pnpm lint:js
```

Use the official `discourse_theme` CLI to sync to a development forum or Theme
Creator. Validate both color schemes in Discourse's Styleguide, then cover at
least `/latest`, `/categories`, one topic, composer, search, user profile,
chat, and the mobile sidebar.

## Design contract

- Keep native Discourse semantics and behavior.
- Extend `--cj-*` tokens before adding isolated values.
- Use logical properties for direction-safe spacing.
- Preserve visible focus and reduced-motion handling.
- Test alongside `discourse-tag-game-card` and `discourse-tab-bar-theme`.
