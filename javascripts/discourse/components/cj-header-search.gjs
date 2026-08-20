import Component from "@glimmer/component";
import SearchMenu from "discourse/components/search-menu";
import DButton from "discourse/ui-kit/d-button";

/**
 * The header search field on the widths core leaves it out.
 *
 * `Contents#showHeaderSearch` returns false for `site.mobileView` and
 * `site.narrowDesktopView` before it checks anything else, and core falls back
 * to an icon that opens a floating panel. The client keeps its field in the
 * header at every width instead — collapsed to a 40px button, expanding inline
 * on focus — so this supplies the field on exactly those widths.
 *
 * It wraps core's own `SearchMenu`, the same component core's `HeaderSearch`
 * wraps, so the search behaviour, results and keyboard handling are all core's.
 * Only the placement is ours.
 *
 * `shouldRender` rather than a reactive getter: both flags come from the boot
 * payload, so there is nothing to react to, and gating here means core's field
 * and this one can never mount two SearchMenus over the same input id.
 *
 * The markup mirrors HeaderSearch's inner two levels — `.search-menu` wrapping
 * the magnifier and the menu — because SearchMenu's own root is
 * `.search-menu-container`, and _header-search.scss measures the pill from
 * `.search-menu`. One mixin then covers both fields.
 */
export default class CjHeaderSearch extends Component {
  static shouldRender(args, context, owner) {
    const site = owner.lookup("service:site");
    const search = owner.lookup("service:search");

    return (
      (site.mobileView || site.narrowDesktopView) &&
      search.searchExperience === "search_field" &&
      !args.topicInfoVisible
    );
  }

  <template>
    <div class="cj-header-search">
      <div class="search-menu">
        <DButton
          @icon="magnifying-glass"
          @title="search.open_advanced"
          @href="/search?expanded=true"
          class="btn search-icon"
        />

        <SearchMenu
          @location="header"
          @searchInputId="cj-header-search-input"
        />
      </div>
    </div>
  </template>
}
