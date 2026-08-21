import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { registerDestructor } from "@ember/destroyable";
import { action } from "@ember/object";
import didInsert from "@ember/render-modifiers/modifiers/did-insert";
import willDestroy from "@ember/render-modifiers/modifiers/will-destroy";
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
 * It wraps core's `SearchMenu`, so search behaviour and results remain core's.
 * The small button wrapper is local because mounting a second complete
 * HeaderSearch during core's responsive handoff briefly creates duplicate
 * global search fields and duplicate input ids.
 *
 * The gate lives in the template rather than the outlet's static
 * `shouldRender` and follows the same reactive site flags as core, so the field
 * stays on exactly the widths where core declines its own placement.
 */
export default class CjHeaderSearch extends Component {
  @service appEvents;
  @service interfaceColor;
  @service router;
  @service search;
  @service site;
  @service siteSettings;

  @tracked compactHeader;
  @tracked hideSearchResults = false;

  keyboardWasVisibleForSearch = false;
  resultsResetFrame = null;
  transitionFrame = null;

  syncCompactHeader = () => {
    this.compactHeader = this.site.mobileView || this.site.narrowDesktopView;
  };

  onKeyboardVisibilityChange = (visible) => {
    const input = document.getElementById("cj-header-search-input");

    if (visible) {
      this.keyboardWasVisibleForSearch =
        this.site.mobileView && document.activeElement === input;
      return;
    }

    if (!this.keyboardWasVisibleForSearch) {
      return;
    }

    this.keyboardWasVisibleForSearch = false;

    if (!this.site.mobileView || !input?.isConnected) {
      return;
    }

    /* Core owns SearchMenu's open state. `hideResults` is its supported
     * external close signal; pulse it for one rendered frame, then restore it
     * so the next focus can open normally. Blurring also collapses our inline
     * mobile field once the software keyboard is gone. */
    input.blur();
    this.hideSearchResults = true;
    this.cancelResultsReset();
    this.resultsResetFrame = window.requestAnimationFrame(() => {
      this.resultsResetFrame = null;
      this.hideSearchResults = false;
    });
  };

  cancelResultsReset = () => {
    if (this.resultsResetFrame !== null) {
      window.cancelAnimationFrame(this.resultsResetFrame);
      this.resultsResetFrame = null;
    }
  };

  constructor() {
    super(...arguments);

    this.syncCompactHeader();
    this.appEvents.on("site-header:force-refresh", this.syncCompactHeader);
    this.appEvents.on(
      "keyboard-visibility-change",
      this.onKeyboardVisibilityChange
    );
    registerDestructor(this, () => {
      this.appEvents.off("site-header:force-refresh", this.syncCompactHeader);
      this.appEvents.off(
        "keyboard-visibility-change",
        this.onKeyboardVisibilityChange
      );
      this.cancelResultsReset();
    });
  }

  @action
  armTransitions(element) {
    this.cancelTransitionSetup();

    /* Two frames establish the collapsed flex geometry before transitions are
     * allowed. When this component remounts after the mobile topic title, that
     * geometry therefore lands immediately; later focus changes can animate. */
    this.transitionFrame = window.requestAnimationFrame(() => {
      this.transitionFrame = window.requestAnimationFrame(() => {
        this.transitionFrame = null;

        if (element.isConnected) {
          element.classList.add("is-transition-ready");
        }
      });
    });
  }

  @action
  cancelTransitionSetup() {
    if (this.transitionFrame !== null) {
      window.cancelAnimationFrame(this.transitionFrame);
      this.transitionFrame = null;
    }
  }

  get shouldRender() {
    return (
      this.compactHeader &&
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
        <div
          class="cj-header-search"
          {{didInsert this.armTransitions}}
          {{willDestroy this.cancelTransitionSetup}}
        >
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
              @hideResults={{this.hideSearchResults}}
            />
          </div>
        </div>
      {{/unless}}
    {{/if}}
  </template>
}
