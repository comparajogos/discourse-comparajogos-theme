import Component from "@glimmer/component";
import { service } from "@ember/service";
import { bind } from "discourse/lib/decorators";
import DAsyncContent from "discourse/ui-kit/d-async-content";
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
          <aside
            class="cj-channel-links
              {{if @publication 'cj-channel-links--publication'}}"
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
      </:content>
    </DAsyncContent>
  </template>
}
