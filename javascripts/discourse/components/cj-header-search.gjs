import Component from "@glimmer/component";
import { service } from "@ember/service";
import SearchMenu from "discourse/components/search-menu";
import getURL from "discourse/lib/get-url";
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
 * The gate lives in the template rather than the outlet's static
 * `shouldRender`: both viewport flags are reactive, so a browser resized from
 * mobile to desktop must remove this field as core mounts its own (and vice
 * versa). Keeping both gates in the render tree also prevents two SearchMenus
 * from owning different inputs after a breakpoint transition.
 *
 * The markup mirrors HeaderSearch's inner two levels — `.search-menu` wrapping
 * the magnifier and the menu — because SearchMenu's own root is
 * `.search-menu-container`, and _header-search.scss measures the pill from
 * `.search-menu`. One mixin then covers both fields.
 */
export default class CjHeaderSearch extends Component {
  @service interfaceColor;
  @service router;
  @service search;
  @service site;
  @service siteSettings;

  get shouldRender() {
    return (
      (this.site.mobileView || this.site.narrowDesktopView) &&
      this.search.searchExperience === "search_field" &&
      !this.args.topicInfoVisible
    );
  }

  get isChatRoute() {
    return this.router.currentRouteName?.startsWith("chat");
  }

  get smallLogoUrl() {
    const url = this.siteSettings.site_logo_small_url;
    return url ? getURL(url) : null;
  }

  get smallLogoDarkUrl() {
    const url = this.siteSettings.site_logo_small_dark_url;
    return url ? getURL(url) : null;
  }

  get hasDistinctDarkLogo() {
    return this.smallLogoDarkUrl && this.smallLogoDarkUrl !== this.smallLogoUrl;
  }

  get darkMediaQuery() {
    if (this.interfaceColor.darkModeForced) {
      return "all";
    } else if (this.interfaceColor.lightModeForced) {
      return "none";
    } else {
      return "(prefers-color-scheme: dark)";
    }
  }

  <template>
    {{#if this.shouldRender}}
      {{#unless this.isChatRoute}}
        <div class="cj-header-search">
          {{#if this.smallLogoUrl}}
            <span class="cj-header-search__small-logo" aria-hidden="true">
              {{#if this.hasDistinctDarkLogo}}
                <picture>
                  <source
                    srcset={{this.smallLogoDarkUrl}}
                    media={{this.darkMediaQuery}}
                  />
                  <img src={{this.smallLogoUrl}} alt="" />
                </picture>
              {{else}}
                <img src={{this.smallLogoUrl}} alt="" />
              {{/if}}
            </span>
          {{/if}}

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
      {{/unless}}
    {{/if}}
  </template>
}
