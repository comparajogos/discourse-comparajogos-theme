import Component from "@glimmer/component";
import { hash } from "@ember/helper";
import { on } from "@ember/modifier";
import { getOwner } from "@ember/owner";
import { LinkTo } from "@ember/routing";
import { service } from "@ember/service";
import withEventValue from "discourse/helpers/with-event-value";
import getURL from "discourse/lib/get-url";
import { i18n } from "discourse-i18n";

export default class CjChannelDirectory extends Component {
  @service router;

  get groupsController() {
    return getOwner(this).lookup("controller:groups.index");
  }

  get visible() {
    return this.router.currentRouteName === "groups.index";
  }

  get channelsOnly() {
    const value = this.router.currentRoute?.queryParams?.is_channel;
    return value === true || value === "true";
  }

  get createURL() {
    return getURL("/workflows/form/631f8c1c-82a0-42f5-91db-a52b4d3904d9");
  }

  <template>
    {{#if this.visible}}
      <header
        class="cj-channel-directory"
        data-channels={{if this.channelsOnly "true" "false"}}
      >
        <nav
          class="cj-channel-directory__nav"
          aria-label={{i18n (themePrefix "channels.directory_navigation")}}
        >
          <LinkTo
            @route="groups.index"
            @query={{hash is_channel=true type=null}}
          >{{i18n (themePrefix "channels.directory_title")}}</LinkTo>
          <LinkTo @route="groups.index" @query={{hash is_channel=false}}>{{i18n
              (themePrefix "channels.all_groups")
            }}</LinkTo>
        </nav>
        {{#if this.channelsOnly}}
          <div class="cj-channel-directory__heading">
            <div><h1>{{i18n (themePrefix "channels.directory_title")}}</h1><p
              >{{i18n (themePrefix "channels.directory_description")}}</p></div>
            <a class="btn btn-primary" href={{this.createURL}}>{{i18n
                (themePrefix "channels.create")
              }}</a>
          </div>
          <input
            class="cj-channel-directory__search"
            aria-label={{i18n (themePrefix "channels.search")}}
            placeholder={{i18n (themePrefix "channels.search")}}
            type="search"
            value={{this.groupsController.filter}}
            {{on
              "input"
              (withEventValue this.groupsController.onFilterChanged)
            }}
          />
        {{/if}}
      </header>
    {{/if}}
  </template>
}
