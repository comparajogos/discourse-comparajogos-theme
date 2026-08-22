import Component from "@glimmer/component";
import { concat } from "@ember/helper";
import { service } from "@ember/service";
import getURL from "discourse/lib/get-url";
import { i18n } from "discourse-i18n";
import ChatUnreadIndicator from "discourse/plugins/chat/discourse/components/chat/header/icon/unread-indicator" with {
  discourseImport: "optional",
};

/**
 * The client's `GlobalHeader` navigation, rendered inside Discourse's own header
 * so the forum reads as the same product rather than a linked site.
 *
 * Catalog destinations are built from the `product_url` setting; the forum's own
 * destinations go through `getURL` so they keep Discourse's routing and work at
 * any mount point. Icons come from the Phosphor sprite in `header.html`,
 * matching the `react-icons/pi` glyphs the client uses.
 *
 * The Chat item carries chat's unread indicator, the way the client's own nav
 * item does. It is core's component rather than a count of our own, so the
 * member's `chat_header_indicator_preference` still decides what shows. That
 * makes the header chat icon a second door to the same room, so
 * `_suppressed.scss` hides it.
 */
export default class CjHeaderNav extends Component {
  /* The docked topic title needs the whole header width. */
  static shouldRender({ topicInfoVisible }) {
    return !topicInfoVisible;
  }

  @service currentUser;
  @service router;
  @service site;
  @service siteSettings;

  get productUrl() {
    return (settings.product_url || "").replace(/\/$/, "");
  }

  get links() {
    const product = this.productUrl;
    const username = this.currentUser?.username;
    const route = this.router.currentRouteName || "";
    const signIn = getURL("/login");

    const links = [
      {
        key: "forum",
        href: getURL("/latest"),
        icon: "users-three",
        active: route === "discovery" || route.startsWith("discovery."),
      },
      {
        key: "lists",
        href: username ? `${product}/u/${username}/lists` : signIn,
        icon: "list-star",
        requiresAuth: !username,
      },
      {
        key: "plays",
        href: username ? `${product}/u/${username}/plays` : signIn,
        icon: "play-circle",
        requiresAuth: !username,
      },
    ];

    if (this.siteSettings.chat_enabled) {
      links.push({
        key: "chat",
        href: username ? getURL("/chat") : signIn,
        icon: "chats-circle",
        requiresAuth: !username,
        active: route.startsWith("chat"),
        unread: Boolean(ChatUnreadIndicator),
      });
    }

    links.push({
      key: "market",
      href: username ? `${product}/profile` : signIn,
      icon: "storefront",
      requiresAuth: !username,
    });

    if (this.site.mobileView) {
      return links.filter((link) => link.key === "market");
    }

    return links;
  }

  <template>
    {{#if this.productUrl}}
      <nav
        class="cj-header-nav"
        aria-label={{i18n (themePrefix "header_nav.label")}}
      >
        {{#each this.links key="key" as |link|}}
          <a
            class="cj-nav-item
              {{if link.active 'active'}}
              {{if link.requiresAuth 'requires-auth'}}"
            href={{link.href}}
            data-cj-nav={{link.key}}
            aria-current={{if link.active "page"}}
          >
            <svg class="cj-icon" aria-hidden="true">
              <use
                href={{concat "#cj-" link.icon (if link.active "-fill" "")}}
              ></use>
            </svg>
            {{#if link.unread}}
              <ChatUnreadIndicator />
            {{/if}}
            <span class="cj-nav-item__label">
              {{i18n (themePrefix (concat "header_nav." link.key))}}
            </span>
          </a>
        {{/each}}
      </nav>
    {{/if}}
  </template>
}
