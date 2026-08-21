import Component from "@glimmer/component";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import { getOwner } from "@ember/owner";
import { service } from "@ember/service";
import dIcon from "discourse/ui-kit/helpers/d-icon";
import { i18n } from "discourse-i18n";

/**
 * The sidebar's collapse control, rendered into `before-main-outlet` rather than
 * left in the header.
 *
 * It cannot be core's own button moved with CSS: `.d-header > .wrap` animates
 * `transform` to dock on scroll, which makes it a containing block, so `fixed`
 * on anything inside the header resolves against the pill. `before-main-outlet`
 * is a sibling of the sidebar inside `#main-outlet-wrapper` and has no
 * transformed ancestor, so the button can sit at the foot of the sidebar column
 * in both states — the sidebar itself is unmounted when collapsed, so a control
 * inside it could never bring it back. On mobile the same control replaces the
 * header hamburger and opens the slide-out navigation from the header's own
 * event path.
 *
 * `toggleSidebar` lives on the application controller and is passed down as an
 * argument, not exposed as a service, so there is nothing to inject.
 * `_sidebar.scss` hides core's header button wherever this one shows.
 */
export default class CjSidebarToggle extends Component {
  @service appEvents;
  @service site;
  @service currentUser;
  @service header;

  get show() {
    return this.site.mobileView || this.currentUser;
  }

  @action
  toggle() {
    if (this.site.mobileView) {
      this.appEvents.trigger("header:keyboard-trigger", {
        type: "hamburger",
      });
    } else {
      getOwner(this).lookup("controller:application").toggleSidebar();
    }
  }

  <template>
    {{#if this.show}}
      <button
        type="button"
        class="btn btn-flat cj-sidebar-toggle"
        title={{i18n "sidebar.title"}}
        aria-label={{i18n "sidebar.title"}}
        aria-controls={{unless this.site.mobileView "d-sidebar"}}
        aria-expanded={{if
          this.site.mobileView
          (if this.header.hamburgerVisible "true" "false")
        }}
        {{on "click" this.toggle}}
      >{{dIcon "table-columns"}}</button>
    {{/if}}
  </template>
}
