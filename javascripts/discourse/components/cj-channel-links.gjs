import Component from "@glimmer/component";
import { service } from "@ember/service";
import { bind } from "discourse/lib/decorators";
import DAsyncContent from "discourse/ui-kit/d-async-content";
import dIcon from "discourse/ui-kit/helpers/d-icon";
import { i18n } from "discourse-i18n";

export default class CjChannelLinks extends Component {
  @service cjChannels;

  @bind
  load(username) {
    return this.cjChannels.forUser(username);
  }

  <template>
    <DAsyncContent @asyncData={{this.load}} @context={{@username}}>
      <:loading></:loading>
      <:content as |channels|>
        {{#if channels.length}}
          {{#if @publication}}
            <aside
              class="cj-channel-banners"
              aria-label={{i18n (themePrefix "channels.label")}}
            >
              {{#each channels key="id" as |channel|}}
                <a
                  class="cj-channel-banner cj-channel-links--publication"
                  href={{channel.href}}
                >
                  <span class="cj-channel-banner__image">
                    {{#if channel.image}}<img
                        src={{channel.image}}
                        alt=""
                        loading="lazy"
                      />{{else}}{{dIcon "users"}}{{/if}}
                  </span>
                  <span class="cj-channel-banner__body">
                    <strong
                      class="cj-channel-banner__name"
                    >{{channel.label}}</strong>
                    <span class="cj-channel-banner__description">{{i18n
                        (themePrefix "channels.banner_description")
                      }}</span>
                    <span class="cj-channel-banner__cta">{{i18n
                        (themePrefix "channels.visit")
                      }}
                      {{dIcon "arrow-right"}}</span>
                  </span>
                </a>
              {{/each}}
            </aside>
          {{else}}
            <aside
              class="cj-channel-links"
              aria-label={{i18n (themePrefix "channels.label")}}
            >
              <span class="cj-channel-links__label">{{i18n
                  (themePrefix "channels.from")
                }}</span>
              {{#each channels key="id" as |channel|}}
                <a class="cj-channel-links__link" href={{channel.href}}>
                  {{#if channel.image}}<img
                      src={{channel.image}}
                      alt=""
                      loading="lazy"
                    />{{/if}}
                  <span>{{channel.label}}</span>
                </a>
              {{/each}}
            </aside>
          {{/if}}
        {{/if}}
      </:content>
    </DAsyncContent>
  </template>
}
