/* eslint-disable ember/no-classic-components */
import Component from "@ember/component";
import { tagName } from "@ember-decorators/component";
import icon from "discourse/helpers/d-icon";
import { i18n } from "discourse-i18n";

@tagName("")
export default class CjUnifiedProfileTabs extends Component {
  get enabled() {
    return settings.unified_profile_shell;
  }

  get profileRoot() {
    const product = (settings.product_url || "").replace(/\/$/, "");
    const username = this.model?.username;

    return product && username ? `${product}/u/${username}` : null;
  }

  get storeUrl() {
    const product = (settings.product_url || "").replace(/\/$/, "");
    const username = this.model?.username;

    return product && username ? `${product}/store/${username}` : null;
  }

  <template>
    {{#if this.enabled}}
      {{#if this.profileRoot}}
        <li class="cj-user-nav cj-user-nav--offers">
          <a href={{this.storeUrl}}>
            {{icon "tag"}}
            <span>{{i18n (themePrefix "unified_profile.tabs.offers")}}</span>
          </a>
        </li>
        <li class="cj-user-nav cj-user-nav--lists">
          <a href="{{this.profileRoot}}/lists">
            {{icon "list"}}
            <span>{{i18n (themePrefix "unified_profile.tabs.lists")}}</span>
          </a>
        </li>
        <li class="cj-user-nav cj-user-nav--plays">
          <a href="{{this.profileRoot}}/plays">
            {{icon "dice"}}
            <span>{{i18n (themePrefix "unified_profile.tabs.plays")}}</span>
          </a>
        </li>
      {{/if}}
    {{/if}}
  </template>
}
