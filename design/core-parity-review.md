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
- The locations map filter follows the operating-system dark preference rather
  than the selected Discourse scheme. It should move to scheme-specific tokens;
  verify marker labels and shadows with the live locations plugin when doing so.
- `_copy.scss` replaces some action labels with CSS-generated Portuguese text and
  hides the rating-tip link. These deserve a separate migration to translated
  component content, preserving the intended review/photo actions and their
  accessible names instead of silently reverting product copy.

## Validation

- JavaScript, template and stylesheet lint pass; repository formatting, color
  synchronization, splash checks and `git diff --check` pass.
- Local Discourse browser suite: 40/41 pass, including all 10 feed tests.
- The remaining mobile profile geometry failure also occurs on unchanged
  `4077444`: baseline 35/36 pass. It is not introduced by this change.
- No live deployment or manual production visual verification was performed.
