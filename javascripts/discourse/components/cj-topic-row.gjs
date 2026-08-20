import Component from "@glimmer/component";
import TopicPostBadges from "discourse/components/topic-post-badges";
import TopicStatus from "discourse/components/topic-status";
import DUserLink from "discourse/ui-kit/d-user-link";
import dAvatar from "discourse/ui-kit/helpers/d-avatar";
import dCategoryLink from "discourse/ui-kit/helpers/d-category-link";
import dDiscourseTags from "discourse/ui-kit/helpers/d-discourse-tags";
import dFormatDate from "discourse/ui-kit/helpers/d-format-date";
import dIcon from "discourse/ui-kit/helpers/d-icon";
import dNumber from "discourse/ui-kit/helpers/d-number";
import dTopicLink from "discourse/ui-kit/helpers/d-topic-link";
import { i18n } from "discourse-i18n";

/**
 * A feed row, replacing the whole set of topic-list columns with one cell.
 *
 * This is the client's `components/forum/TopicItem.tsx` reading order: who
 * started it and when, then the title, then engagement with the category on the
 * right, then who replied last. A table of counts answers "which column is
 * this"; a feed row answers "is this worth reading".
 *
 * Core's own cell components and helpers do the work wherever they exist, so
 * unread state, permissions, emoji, and localisation stay correct.
 */
export default class CjTopicRow extends Component {
  get originalPoster() {
    return this.args.topic.posters?.[0]?.user;
  }

  get lastPoster() {
    return this.args.topic.lastPosterUser;
  }

  /* Only worth showing when someone other than the author has spoken. */
  get showLastReply() {
    return this.args.topic.replyCount > 0 && this.lastPoster;
  }

  <template>
    <td class="topic-list-data cj-feed-cell">
      <div class="cj-feed">
        <div class="cj-feed__main">
          <div class="cj-feed__byline">
            {{#if this.originalPoster}}
              <DUserLink @user={{this.originalPoster}} class="cj-feed__avatar">
                {{dAvatar this.originalPoster imageSize="small"}}
              </DUserLink>
              <DUserLink @user={{this.originalPoster}}>
                <span class="cj-feed__author">
                  {{this.originalPoster.username}}
                </span>
              </DUserLink>
            {{/if}}
            <span class="cj-feed__age">
              {{dFormatDate @topic.createdAt format="tiny" noTitle="true"}}
            </span>

            <span class="cj-feed__taxonomy">
              {{~dCategoryLink @topic.category~}}
              {{~dDiscourseTags @topic mode="list"~}}
            </span>

            <TopicStatus @topic={{@topic}} @context="topic-list" />
          </div>

          <div class="cj-feed__title topic-list-main-link">
            {{dTopicLink @topic}}
            <TopicPostBadges
              @unreadPosts={{@topic.unread_posts}}
              @unseen={{@topic.unseen}}
              @url={{@topic.lastUnreadUrl}}
            />
          </div>

          <div class="cj-feed__stats">
            <span
              class="cj-feed__stat {{if @topic.liked '--liked'}}"
              title={{i18n "likes_lowercase" count=@topic.like_count}}
            >
              {{dIcon (if @topic.liked "heart" "far-heart")}}
              {{@topic.like_count}}
            </span>

            <span class="cj-feed__stat">
              {{dIcon "far-comment"}}
              {{@topic.replyCount}}
            </span>

          </div>

          {{#if this.showLastReply}}
            <a
              href={{@topic.lastPostUrl}}
              title={{@topic.bumpedAtTitle}}
              class="cj-feed__last-reply"
            >
              {{dIcon "reply"}}
              <span class="cj-feed__last-reply-name">
                {{this.lastPoster.username}}
              </span>
              <span>
                {{i18n (themePrefix "topic_feed.replied")}}
                {{dFormatDate @topic.bumpedAt format="tiny" noTitle="true"}}
              </span>
            </a>
          {{/if}}
        </div>

        <div class="cj-feed__aside">
          <div class="cj-feed__participants">
            {{#each @topic.featuredUsers as |poster|}}
              {{#if poster.moreCount}}
                <span class="cj-feed__more-count">{{poster.moreCount}}</span>
              {{else}}
                <DUserLink
                  @username={{poster.user.username}}
                  @href={{poster.user.path}}
                >
                  {{dAvatar
                    poster
                    avatarTemplatePath="user.avatar_template"
                    usernamePath="user.username"
                    namePath="user.name"
                    imageSize="small"
                  }}
                </DUserLink>
              {{/if}}
            {{/each}}
          </div>

          <span class="cj-feed__views">
            {{dNumber @topic.views numberKey="views_long"}}
          </span>
        </div>
      </div>
    </td>
  </template>
}
