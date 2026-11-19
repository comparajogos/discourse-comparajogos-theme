import Component from "@glimmer/component";
import { hash } from "@ember/helper";
import { LinkTo } from "@ember/routing";
import { service } from "@ember/service";
import { trustHTML } from "@ember/template";
import { bind } from "discourse/lib/decorators";
import getURL from "discourse/lib/get-url";
import { or } from "discourse/truth-helpers";
import DAsyncContent from "discourse/ui-kit/d-async-content";
import dAgeWithTooltip from "discourse/ui-kit/helpers/d-age-with-tooltip";
import { i18n } from "discourse-i18n";
import { channelImage } from "../services/cj-channels";

export default class CjChannelPage extends Component {
  @service router;
  @service cjChannels;

  get image() {
    return channelImage(this.args.group.flair_url);
  }

  get visible() {
    return (
      this.args.group?.is_channel &&
      this.router.currentRouteName === "group.index"
    );
  }

  get team() {
    return (
      this.router.currentRoute?.queryParams?.channel_team === "true" ||
      this.router.currentRoute?.queryParams?.channel_team === true
    );
  }

  get archiveURL() {
    return getURL(
      `/g/${encodeURIComponent(this.args.group.name)}/activity/topics`
    );
  }

  get manageURL() {
    return getURL(
      `/g/${encodeURIComponent(this.args.group.name)}/manage/profile`
    );
  }

  @bind
  load(name) {
    return this.cjChannels.publications(name);
  }

  <template>
    {{#if this.visible}}
      <section
        class="cj-channel-page"
        data-view={{if this.team "team" "publications"}}
      >
        <header class="cj-channel-page__header">
          {{#if this.image}}<img
              class="cj-channel-page__image"
              src={{this.image}}
              alt=""
            />{{/if}}
          <div class="cj-channel-page__identity">
            <h1>{{or @group.full_name @group.name}}</h1>
            <span class="cj-channel-page__handle">@{{@group.name}}</span>
            {{#if @group.bio_cooked}}<div
                class="cooked cj-channel-page__bio"
              >{{trustHTML @group.bio_cooked}}</div>{{/if}}
          </div>
          {{#if @group.can_edit_group}}<a
              class="btn btn-default cj-channel-page__manage"
              href={{this.manageURL}}
            >{{i18n (themePrefix "channels.manage")}}</a>{{/if}}
        </header>
        <nav
          class="cj-channel-page__nav"
          aria-label={{i18n (themePrefix "channels.label")}}
        >
          <LinkTo
            class={{unless this.team "cj-channel-page__tab--selected"}}
            @route="group.index"
            @model={{@group.name}}
            @query={{hash channel_team=false}}
          >{{i18n (themePrefix "channels.publications")}}</LinkTo>
          <LinkTo
            class={{if this.team "cj-channel-page__tab--selected"}}
            @route="group.index"
            @model={{@group.name}}
            @query={{hash channel_team=true}}
          >{{i18n (themePrefix "channels.team")}}</LinkTo>
        </nav>
        {{#unless this.team}}
          <DAsyncContent @asyncData={{this.load}} @context={{@group.name}}>
            <:content as |topics|>
              {{#if topics.length}}
                <div class="cj-channel-page__publications">
                  {{#each topics key="id" as |topic|}}
                    <article class="cj-channel-publication">
                      {{#if topic.image_url}}<a
                          class="cj-channel-publication__image"
                          href={{topic.href}}
                          tabindex="-1"
                          aria-hidden="true"
                        ><img
                            src={{topic.image_url}}
                            alt=""
                            loading="lazy"
                          /></a>{{/if}}
                      <div>
                        <h2><a href={{topic.href}}>{{topic.title}}</a></h2>
                        {{#if topic.excerpt}}<p>{{trustHTML
                              topic.excerpt
                            }}</p>{{/if}}
                        <span
                          class="cj-channel-publication__date"
                        >{{dAgeWithTooltip topic.created_at}}</span>
                      </div>
                    </article>
                  {{/each}}
                </div>
                <a
                  class="btn btn-default cj-channel-page__more"
                  href={{this.archiveURL}}
                >{{i18n (themePrefix "channels.all_publications")}}</a>
              {{else}}
                <p class="cj-channel-page__empty">{{i18n
                    (themePrefix "channels.empty")
                  }}</p>
              {{/if}}
            </:content>
            <:error><p>{{i18n (themePrefix "channels.load_error")}}
                <a href={{this.archiveURL}}>{{i18n
                    (themePrefix "channels.all_publications")
                  }}</a></p></:error>
          </DAsyncContent>
        {{/unless}}
      </section>
    {{/if}}
  </template>
}
