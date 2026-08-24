# Unified user profile implementation plan

Status: implemented locally across the React client and Discourse theme; not
committed, pushed, or deployed. The theme cutover remains disabled by default
until the React changes are deployed.

This plan was traced against:

- `comparajogos/client` at `c4ae1b1` (2026-08-21);
- `discourse-comparajogos-theme` at `2ffd6e2` (2026-08-23);
- Discourse core at `ba63d427` (2026-07-25);
- the production profiles `/u/renato` and `/f/u/renato/summary` on
  2026-08-24.

The theme worktree contains the implementation behind the
`unified_profile_shell` feature flag. Deploy the React client first, then enable
the theme flag as the explicit cutover step; `profile_bridge` remains available
for rollback during the transition.

## Product decision

Compara Jogos has one member profile, not separate “game” and “forum”
profiles. Both applications render the same profile shell:

1. member identity;
2. shared headline activity;
3. one profile tab row;
4. the active tab’s content.

The tab row is the only product-level navigation between the React application
and Discourse. Crossing the application boundary may perform a full document
navigation, but the shell geometry, labels, tokens, active state, responsive
behavior, and data must remain visually continuous.

React owns the canonical **Resumo**. Discourse continues to own forum activity,
achievements, notifications, messages, invites, and preferences. There is no
Compara Jogos bridge, Fórum/Jogos switch, duplicate “Perfil” link, or “Ver no
Compara Jogos” action in the finished shell.

The shell has two deliberate densities. Resumo is expanded by default because
its job is orientation. Partidas, Listas, Ofertas, and every Discourse-owned
destination start compact so their task-specific interface remains dominant.
Those focused pages expose the same secondary profile facts through an inline,
accessible disclosure; opening it never changes routes. In particular, Ofertas
remains a store surface rather than becoming a second profile summary.

## Canonical route contract

| Tab          | Owner     | Canonical route                | Active for                                         |
| ------------ | --------- | ------------------------------ | -------------------------------------------------- |
| Resumo       | React     | `/u/:username`                 | exact route                                        |
| Partidas     | React     | `/u/:username/plays`           | plays route and its query-state tabs               |
| Listas       | React     | `/u/:username/lists`           | list index, list detail, stats, stores, and import |
| Ofertas      | React     | `/store/:username`             | store route and its filters                        |
| Atividade    | Discourse | `/f/u/:username/activity`      | all activity subroutes                             |
| Conquistas   | Discourse | `/f/u/:username/badges`        | badges route                                       |
| Notificações | Discourse | `/f/u/:username/notifications` | owner/admin when core permits                      |
| Mensagens    | Discourse | `/f/u/:username/messages`      | owner/admin when core permits                      |
| Convites     | Discourse | `/f/u/:username/invited`       | when core permits invitations                      |
| Preferências | Discourse | `/f/u/:username/preferences`   | when core permits editing                          |

The public content tabs—Resumo, Partidas, Listas, Ofertas, Atividade, and
Conquistas—come first. Viewer-specific/private tabs follow them and use the
same permission rules as Discourse core. A member with no offers still has an
Ofertas tab and receives a real empty state; the route must not bounce back to
Resumo.

Global navigation remains viewer-scoped: global Listas, Partidas, and Meu
Comércio concern the signed-in viewer. Profile tabs are subject-scoped: they
always concern `:username` in the profile shell.

### Legacy summary behavior

- `/f/u/:username/summary` and the Discourse user-root route redirect to
  `/u/:username` only after React reaches summary parity.
- Use `window.location.replace` for the compatibility redirect so Back does
  not bounce through the obsolete page.
- Never redirect `/f/u/:username/summary.json`; React continues to consume it.
- All React links that currently target the forum summary must instead target
  the appropriate profile tab, normally `/f/u/:username/activity`.
- React owns the canonical metadata for `/u/:username`; Discourse’s legacy
  summary remains `noindex` during the compatibility window.

## Shared profile shell contract

### Persistent region

Every user-scoped page renders, in this order:

1. avatar, display name, handle, company marker, reputation, sales, and
   location;
2. headline counts for offers, auctions, plays, collection, and lists, omitting
   zero-value counts but preserving stable spacing;
3. the profile tab navigation;
4. a divider and the active page content.

App-specific actions do not alter the shell hierarchy. Discourse Admin/Expand,
React Criar lista, Nova partida, and filter controls occupy contextual action
slots or the active page toolbar below the tabs.

Remove the path-dependent Loja, Perfil, and Fórum links currently emitted by
React `UserHeader`; the tabs replace them. Remove the list breadcrumb from the
list index because the shell and active tab already establish the member and
section. A list detail may retain only the list name and its local view tabs.

### Responsive and accessible behavior

- Implement route tabs as real links inside a labelled `nav`, not as state-only
  buttons.
- Mark exactly one item with `aria-current="page"`.
- Match Discourse `DHorizontalOverflowNav`: horizontally scrollable tabs,
  left/right affordances when overflow exists, drag/touch scrolling, and the
  active item automatically brought into view.
- Keep every interactive target at least 44px high on narrow viewports.
- At 200% zoom, the identity wraps before the tab row and no tab becomes
  unreachable.
- Preserve native focus rings, reduced motion, RTL scroll direction, and
  keyboard access.
- Use the existing React/Discourse design tokens; do not introduce a third set
  of profile-only colors, radii, or spacing values.

## React implementation (`comparajogos/client`)

### 1. Extract the shell

Create `components/user/UserProfileShell.tsx` and
`components/user/UserProfileTabs.tsx`.

`UserProfileShell` owns:

- `UserHeader`;
- the existing `userProfileSummary` GraphQL query and `ProfileStatCards`;
- forum navigation capability state;
- the active route supplied by the page;
- the shared tab row and contextual action slot;
- identity/loading/not-found handling.

Apollo already deduplicates the `user` and `userProfileSummary` queries, so the
shell may render on every user-scoped page without duplicating requests.
`UserProfileSummary` becomes Summary content only; it must not render its own
header or stat row.

Add a link-based horizontal overflow component rather than reusing
`components/ui/tabs.tsx`; those Base UI tabs are appropriate for the local
Partidas list/statistics/suggestions state, not cross-route or cross-document
profile navigation.

### 2. Adopt the shell on every React member route

- `pages/u/[username]/index.tsx`: active Resumo.
- `pages/u/[username]/plays.tsx`: active Partidas; keep `PlayList`’s period and
  owner-only list/statistics/suggestions controls as secondary page controls.
- `pages/u/[username]/lists.tsx`: active Listas; retire `ProfileHeader` and its
  duplicate username breadcrumb.
- `pages/u/[username]/list/[[...list]].tsx`: active Listas for detail, stats,
  stores, and import subroutes; keep list-local tabs and carousel beneath the
  profile tabs.
- `pages/store/[username].tsx` / `SellerStore.tsx`: active Ofertas; move the
  header out of the `OffersGrid` callback and stop redirecting users without a
  seller location. Render the existing empty state instead.

After all consumers migrate, remove `components/list/ProfileHeader.tsx` and the
profile-link behavior from `components/common/UserBreadcrumb.tsx` where it is
no longer used.

### 3. Define navigation capabilities

Add `pages/api/forum-profile-context.ts`. It must:

- accept only a validated username;
- call the configured Discourse origin only;
- forward only the Discourse `_t` cookie when present, never arbitrary request
  cookies;
- sanitize the response to tab booleans rather than proxying raw account data;
- combine target-user visibility/badge state with the current Discourse
  session’s `can_send_private_messages`, `can_invite_to_forum`, admin, and
  editing capabilities;
- return public tabs when anonymous and exact owner/admin tabs when
  authenticated;
- use public caching only for anonymous data and `private, no-store` whenever
  viewer-specific permissions are involved.

If the context request fails, keep the React tabs usable and omit only
permission-dependent Discourse tabs. Do not turn a forum outage into a missing
React profile.

Update `routes/index.ts` with named functions for every profile tab. All
components use the route contract; no component assembles forum profile URLs
inline.

## Complete React Summary parity

`pages/api/forum-summary.ts` already proxies the correct Discourse endpoint but
trims most of its response. Expand it rather than adding a parallel data
source.

| Discourse field/collection                      | React presentation                                             |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `days_visited`                                  | days active/visited statistic                                  |
| `time_read`, `recent_time_read`                 | localized compact durations with full accessible titles        |
| `topics_entered`, `posts_read_count`            | reading activity statistics                                    |
| `likes_given`, `likes_received`                 | separate, accurately labelled statistics                       |
| `bookmark_count`                                | owner-only statistic when Discourse includes it                |
| `topic_count`, `post_count`                     | created topics and replies                                     |
| `topics`, `replies`                             | complete Discourse top sets; remove React’s hard limit of five |
| `links`                                         | best links, clicks, and source-topic links                     |
| `most_replied_to_users`                         | member relationship list                                       |
| `most_liked_by_users`                           | “most liked by” relationship list                              |
| `most_liked_users`                              | “most liked” relationship list                                 |
| `top_categories`                                | category, topic, and reply counts with forum links             |
| `badges` plus top-level badge lookup            | top achievements and “more” destination                        |
| `can_see_summary_stats`, `can_see_user_actions` | visibility and linkability gates                               |

The proxy must support both the current lookup-table topic shape and nested
reply topics so a Discourse upgrade cannot silently empty replies. Normalize
forum avatar templates and relative URLs in one tested helper.

For authenticated self-summary parity, forward only `_t` to Discourse. Mark
that response `private, no-store`. Anonymous responses remain publicly cached
for five minutes with stale-while-revalidate, as they are today. Never merge a
personalized summary into the public cache.

Render the canonical Summary in this sequence:

1. active auctions and offers;
2. most-played games and recent plays;
3. math-trade participation;
4. lists;
5. forum statistics;
6. best topics and replies;
7. best links and member relationships;
8. top categories and achievements.

“No fórum” remains a content heading, not a product switch. Its action becomes
“Ver atividade” and targets the Atividade tab. Empty sections collapse
individually. A timeout/outage renders a compact retryable forum-section error;
a hidden forum profile omits forum sections and forum tabs without affecting
game data.

## Discourse theme implementation

### 1. Shared public tabs

Use the stable `user-main-nav` plugin outlet; do not override core
`user-nav.gjs` and do not reintroduce template extension overrides.

Add one connector per React-owned public tab under
`javascripts/discourse/connectors/user-main-nav/`. Each connector renders a
normal external anchor using the outlet’s user model. CSS orders the React
tabs before native Activity/Badges/private tabs and hides only core’s internal
Summary item. Native Discourse items keep their existing permission logic and
`DHorizontalOverflowNav` behavior.

Add an API initializer that redirects the human-facing `user.summary` route to
the React Summary when the cutover setting is enabled. Exclude JSON requests
and use `location.replace`. Direct tab anchors already use canonical URLs, so
the initializer is a compatibility path for bookmarks and old links.

### 2. Unified header data

Refactor the current `CjProfileBridge` full-profile mode into neutral headline
activity within the native Discourse identity header:

- remove brand/switch copy and named-list shortcut rows from the full profile;
- keep plays, collection, lists, offers, and auctions using the same ordering
  and labels as React;
- extend the catalog query only for public seller/location metadata that the
  shared header contract needs;
- preserve the session cache shared by profile and user card;
- preserve quiet failure when Hasura is unavailable.

The avatar popup is not a full profile shell. Keep it compact: game headline
facts and at most two named-list shortcuts are acceptable metadata, with no
brand switch. Its existing profile link naturally reaches React Summary after
the compatibility redirect.

Replace the broad `profile_bridge` concept with a staged
`unified_profile_shell` theme setting. Keep the old behavior available for one
release as the rollback path; remove its component, service branches, locale
keys, icons, documentation, and tests only after production cutover is stable.

## States and permissions

| State                              | Required behavior                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| Unknown catalog username           | React returns a real profile not-found state; Discourse remains usable          |
| No game activity                   | identity and tabs remain; zero-value cards/sections collapse                    |
| No offers                          | Ofertas tab remains and shows the existing seller empty state                   |
| Hidden forum profile               | omit forum summary data/tabs according to Discourse; never disclose cached data |
| Anonymous viewer                   | public tabs and anonymous Discourse summary only                                |
| Viewing self                       | add permitted private tabs and owner-only bookmark/action links                 |
| Admin viewing another user         | mirror Discourse’s extra tab/action permissions                                 |
| Forum timeout/outage               | game profile remains; forum section shows retryable failure                     |
| Catalog/Hasura outage in Discourse | native forum profile remains; catalog facts collapse quietly                    |
| Long names/translations            | identity wraps; tabs remain reachable without clipping                          |
| Mobile/200% zoom/RTL               | active tab stays visible; 44px targets; correct scroll direction                |

## Test plan

### React

- Unit-test route-to-active-tab mapping, including every nested list route.
- Unit-test public, self, admin, seller-empty, hidden-profile, and capability
  fallback tab sets.
- Test `forum-profile-context` username validation, cookie allow-listing,
  sanitization, and cache headers.
- Expand API tests for every Discourse summary field, old/new topic shapes,
  relative URLs, avatar templates, 403/404, timeouts, and authenticated
  `private, no-store` responses.
- Component-test shell loading, not-found, empty, partial failure, keyboard,
  `aria-current`, and overflow behavior.
- Add Playwright coverage for Summary, Partidas, Lists, list detail, Ofertas,
  cross-app Activity, browser Back, and the absence of redirect loops.
- Add desktop/mobile screenshot coverage for own profile, another member,
  empty seller, hidden forum profile, long name, and overflowed private tabs.
- Run `npm run lint`, `npm run ts`, `npm test`, the focused Playwright suite,
  and `npm run build`.

### Discourse theme

- Acceptance-test tab order, canonical hrefs, core permission preservation,
  active state, and mobile overflow.
- Test legacy HTML Summary redirect, user-root redirect, Back behavior, feature
  flag off, and an explicit non-redirect assertion for `summary.json`.
- Test profile/card cache sharing, zero data, Hasura failure, and removal of
  duplicate full-profile lists.
- Keep touch-target and wrapping assertions at mobile breakpoints.
- Run Prettier, template lint, Stylelint, ESLint, color-contract checks, and the
  Discourse theme acceptance suite.

### Production acceptance

- Validate own and other profiles in light/dark schemes on desktop and mobile.
- Verify every tab lands on the same `:username`, including admin/self-only
  tabs.
- Compare every React forum Summary value/section against Discourse JSON for a
  high-activity member, a new member, and a hidden profile.
- Verify React’s Fórum/Atividade links never target the legacy Summary route.
- Monitor React API errors, Discourse navigation errors, redirect counts, and
  forum-summary latency for one release before cleanup.

## Rollout and rollback

1. **React foundation:** ship the shell, tab route contract, and all React page
   migrations behind `unified_user_profile`; do not redirect Discourse.
2. **Summary parity:** ship the complete proxy/renderer and pass the production
   comparison matrix while the legacy Summary remains available.
3. **Theme preparation:** ship external public tabs, neutral header facts, and
   compatibility redirect behind `unified_profile_shell=false`.
4. **Cutover:** enable React first, then enable the theme setting. Confirm the
   Summary tab and legacy route land on React without loops.
5. **Observation:** keep the old bridge and redirect flag available for one
   release. Rollback is disabling the theme setting, then the React flag; no
   database migration is involved.
6. **Cleanup:** remove the old bridge/switch experiment, obsolete locale keys,
   duplicated React headers/breadcrumbs, and temporary flags only after the
   observation gate passes.

Deploy React before the theme at every stage. Never enable the redirect while
React Summary is incomplete or its shared shell flag is off.

## Definition of done

- The profile header and tab row are recognizably the same component contract
  on React and Discourse at all supported widths.
- Every member-scoped React route uses the shell and correct active tab.
- React Summary contains every Discourse Summary field/section the current
  viewer is allowed to see.
- No visible link or redirect points from React back to the legacy forum
  Summary.
- Private data never enters a shared cache.
- Direct legacy URLs, browser Back, hidden profiles, partial outages, and empty
  profiles behave deliberately.
- The avatar popup remains useful without presenting a second profile model.
- Both repositories’ automated checks and the production comparison matrix
  pass before redirect cutover.
