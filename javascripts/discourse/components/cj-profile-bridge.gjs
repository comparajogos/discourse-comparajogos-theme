import Component from "@glimmer/component";
import { service } from "@ember/service";
import icon from "discourse/helpers/d-icon";
import { bind } from "discourse/lib/decorators";
import DAsyncContent from "discourse/ui-kit/d-async-content";
import { i18n } from "discourse-i18n";

/**
 * A compact hand-off from a forum identity to the same person's catalog
 * identity. The hierarchy mirrors the React profile: identity/action first,
 * headline pills second, list destinations last.
 */
export default class CjProfileBridge extends Component {
  @service cjProfileCatalog;

  get enabled() {
    return settings.profile_bridge;
  }

  @bind
  async loadProfile(username) {
    const profile = await this.cjProfileCatalog.resolve(username);

    if (!profile) {
      return null;
    }

    return {
      ...profile,
      displayMetrics: this.args.compact ? profile.cardMetrics : profile.metrics,
    };
  }

  <template>
    {{#if this.enabled}}
      <DAsyncContent @asyncData={{this.loadProfile}} @context={{@username}}>
        {{! Reserve the bridge's usual geometry while public data loads. Errors
            still collapse quietly so a catalog outage cannot break Discourse. }}
        <:loading>
          <div
            class="cj-profile-bridge cj-profile-bridge--{{@variant}}
              cj-profile-bridge--loading"
            aria-hidden="true"
          >
            <div class="cj-profile-bridge__header">
              <span
                class="cj-profile-bridge__skeleton cj-profile-bridge__skeleton--brand"
              ></span>
              <span
                class="cj-profile-bridge__skeleton cj-profile-bridge__skeleton--action"
              ></span>
            </div>
            <div class="cj-profile-bridge__skeleton-row">
              <span
                class="cj-profile-bridge__skeleton cj-profile-bridge__skeleton--metric"
              ></span>
              <span
                class="cj-profile-bridge__skeleton cj-profile-bridge__skeleton--metric-wide"
              ></span>
              <span
                class="cj-profile-bridge__skeleton cj-profile-bridge__skeleton--metric-short"
              ></span>
            </div>
            {{#unless @compact}}
              <span
                class="cj-profile-bridge__skeleton cj-profile-bridge__skeleton--lists"
              ></span>
            {{/unless}}
          </div>
        </:loading>
        <:empty></:empty>
        <:content as |profile|>
          <section
            class="cj-profile-bridge cj-profile-bridge--{{@variant}}"
            aria-label={{i18n (themePrefix "profile_bridge.label")}}
          >
            <div class="cj-profile-bridge__header">
              <span class="cj-profile-bridge__brand">
                {{icon "dice"}}
                {{i18n (themePrefix "profile_bridge.brand")}}
              </span>
              <a class="cj-profile-bridge__switch" href={{profile.profileUrl}}>
                <span>{{i18n
                    (themePrefix "profile_bridge.view_profile")
                  }}</span>
                {{icon "arrow-right"}}
              </a>
            </div>

            <ul
              class="cj-profile-bridge__metrics"
              aria-label={{i18n (themePrefix "profile_bridge.metrics_label")}}
            >
              {{#each profile.displayMetrics key="key" as |metric|}}
                <li>
                  <a
                    class="cj-profile-bridge__metric"
                    data-cj-profile-metric={{metric.key}}
                    href={{metric.href}}
                  >
                    {{icon metric.icon}}
                    <strong>{{metric.count}}</strong>
                    <span>
                      {{i18n (themePrefix metric.labelKey) count=metric.count}}
                    </span>
                  </a>
                </li>
              {{/each}}
            </ul>

            {{#unless @compact}}
              {{#if profile.lists.length}}
                <div class="cj-profile-bridge__lists">
                  <span class="cj-profile-bridge__lists-label">
                    {{i18n (themePrefix "profile_bridge.lists_label")}}
                  </span>
                  <ul class="cj-profile-bridge__list-items">
                    {{#each profile.lists key="href" as |list|}}
                      <li>
                        <a
                          class="cj-profile-bridge__list"
                          href={{list.href}}
                          title={{list.name}}
                        >
                          {{icon list.icon}}
                          <span>{{list.name}}</span>
                          <strong>{{list.count}}</strong>
                        </a>
                      </li>
                    {{/each}}
                  </ul>
                </div>
              {{/if}}
            {{/unless}}
          </section>
        </:content>
      </DAsyncContent>
    {{/if}}
  </template>
}
