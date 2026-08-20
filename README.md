# Compara Jogos Discourse theme

The full Discourse theme for the Compara Jogos community. Version 2 uses
[Manuel Kostka's Canvas Theme Template](https://meta.discourse.org/t/canvas-theme-template/352730)
as its compatibility-first foundation and maps the React client's design
tokens onto Discourse's public custom properties.

The theme intentionally keeps its CSS surface small. Discourse core owns the
composer, topic posts, form controls, menus, and responsive behavior. The
theme owns product-level color tokens, the shared 85rem shell, the header, and
the optional Blocks product bridge.

## Install

In Discourse, open **Admin → Customize → Themes → Install → From a git
repository** and use:

```text
https://github.com/comparajogos/discourse-comparajogos-theme
```

Select **Compara Jogos Light** as the default color scheme and associate
**Compara Jogos Dark** as its dark-mode scheme. In site typography settings,
use **Inter** for base and heading fonts to match the React client exactly.
Set **Search experience** to **Search field in site header** so the product
header uses the same search-first composition as the React client.

The required **Canvas Settings** component is installed with the theme. Other
Comparajogos components are deliberately not bundled into the base; validate
the base first, then enable the production component set one at a time.

The theme styles the existing `.cj-header-nav` integration when present. The
underlying Discourse header and navigation still work without it.

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
- Prefer Canvas and Discourse custom properties over component selectors.
- Extend `--cj-*` tokens before adding isolated values.
- Use logical properties for direction-safe spacing.
- Preserve visible focus and reduced-motion handling.
- Never restyle `#reply-control`; composer compatibility belongs to core.
- Test production theme components one at a time after the base passes.
