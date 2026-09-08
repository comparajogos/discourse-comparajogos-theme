# Core parity review

Reviewed against the local Discourse checkout at `ed7424217f3` on 2026-09-08.
This is a targeted source and regression-test review, not a certification of
every installed plugin or every live page.

## Feed behavior restored

- Use core's `TopicLink`, including its plugin outlet, linked-post destination,
  screen-reader read label, and the class used by native navigation bookkeeping.
- Preserve heading semantics and the focus/blur row-selection lifecycle.
- Use `NewRepliesDot` for nested topics with `has_new_replies`; use standard
  badges only when the containing list enables them for non-nested topics.
- Respect category visibility, pinned uncategorized topics, and user tag context.
- Restore featured destinations, participant groups, liked-post links, and the
  title/category/count/activity extension outlets.
- Use core's excerpt component and pinned-excerpt visibility settings. The feed
  no longer forces excerpts onto every topic that happens to have an excerpt.
- Keep reply-count links pointed at the first post and activity links pointed
  at core's last-post URL, including its nested-view handling.
- Leave title read colors and weights to core's tokens and selectors, including
  browser-history fading for anonymous visitors.

The author byline, compact statistics, and activity pill remain intentional
presentation choices. Private-message lists retain the entire native row,
including their group unread indicator and participant controls.

## Overrides removed or narrowed

| Override                                | Change and reason                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Feed and table title colors/weights     | Removed duplicate declarations. `properties.scss` already sets core's title tokens.                            |
| Primary/danger/success foreground rules | Removed duplicates of the button token mappings so native states can apply.                                    |
| Default button backgrounds/borders      | Moved to core's default-button tokens. Retained the product hover shadow.                                      |
| Hidden bulk-selection control           | Removed suppression; core owns moderator access and list selection.                                            |
| Event fields hidden by child position   | Removed fragile legacy rules; field order no longer identifies the intended control in the current event form. |
| Poll field hidden by child position     | Removed legacy selector; the current group control has its own `poll-allowed-groups` container.                |
| Global mobile `tbody` border removal    | Scoped to topic lists so unrelated tables retain native borders.                                               |
| Keyboard selection shadow suppression   | Removed so native keyboard selection remains visible in lists and search.                                      |

## Retained and follow-up candidates

- Frame, sidebar, header, chat-panel and nested sticky offsets compensate for the
  theme's intentional layout. Source comparison alone does not justify deleting
  them; removal needs live desktop/mobile geometry checks.
- Catalog registration, profile fields and catalog navigation suppressions are
  product decisions rather than obsolete core fixes. They remain intact.

## Follow-ups completed

- Map filter, marker shadows and marker-label colors now come from generated
  Discourse scheme tokens. Both schemes are tested against the opposite OS
  preference, using the plugin's CSS structure without fetching remote tiles.
- Review/photo reply actions now use translated component labels and retain
  core's reply permissions and action. Edit and special composer labels remain
  native. The optional ratings tip has a translated button, expanded state and
  its original details/dismissal behavior; the CSS hiding its control is gone.
- The mobile-profile failure was a test-environment mismatch: QUnit omits theme
  CSS and does not resize its viewport when mobile mode is forced. Geometry is
  now tested in a system browser at 390 × 844; QUnit checks the disclosure and
  member controls without making CSS assertions.

## Validation

- JavaScript, template and stylesheet lint pass; repository formatting, color
  synchronization, splash checks and `git diff --check` pass.
- Local Discourse QUnit suite: 46/46 pass, including all 10 feed tests.
- System browser checks: 3/3 pass, covering mobile profile geometry and both map
  schemes. The theme CSS is compiled and loaded for these checks.
- Ruby lint, JavaScript, template, stylesheet, formatting and contract checks pass.
- No manual production visual verification was performed. The optional ratings
  adapter was checked against its source; its translated content is tested in QUnit.
