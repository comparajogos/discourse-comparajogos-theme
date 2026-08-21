import Component from "@glimmer/component";
import TopicPostBadges from "discourse/components/topic-post-badges";
import TopicStatus from "discourse/components/topic-status";
import DUserLink from "discourse/ui-kit/d-user-link";
import dAvatar from "discourse/ui-kit/helpers/d-avatar";
import dCategoryLink from "discourse/ui-kit/helpers/d-category-link";
import dDirSpan from "discourse/ui-kit/helpers/d-dir-span";
import dDiscourseTags from "discourse/ui-kit/helpers/d-discourse-tags";
import dFormatDate from "discourse/ui-kit/helpers/d-format-date";
import dIcon from "discourse/ui-kit/helpers/d-icon";
import dNumber from "discourse/ui-kit/helpers/d-number";
import dTopicLink from "discourse/ui-kit/helpers/d-topic-link";
import { i18n } from "discourse-i18n";

const UPDATED_AFTER_LAST_POST_THRESHOLD_MS = 24 * 60 * 60 * 1000;

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

  /* A bump is not always a reply: an edit, a category change or a recategorise
   * moves bumped_at past last_posted_at without anyone speaking. Saying
   * "{name} replied" against that timestamp is simply false, so the pill drops
   * the name and says the topic was updated instead. The one-day threshold is
   * Horizon's (themes/horizon/javascripts/discourse/lib/topic-activity.js) —
   * below it the difference is housekeeping nobody means to read as activity. */
  get wasUpdatedAfterLastPost() {
    const { bumpedAt, last_posted_at: lastPostedAt } = this.args.topic;

    if (!bumpedAt || !lastPostedAt) {
      return false;
    }

    const bumped = new Date(bumpedAt).getTime();
    const posted = new Date(lastPostedAt).getTime();

    return bumped - posted > UPDATED_AFTER_LAST_POST_THRESHOLD_MS;
  }

  /* Only worth showing when someone other than the author has spoken. */
  get showLastReply() {
    return (
      this.args.topic.replyCount > 0 &&
      this.lastPoster &&
      !this.wasUpdatedAfterLastPost
    );
  }

  get showUpdated() {
    return this.wasUpdatedAfterLastPost;
  }

  <template>
    <td class="topic-list-data cj-feed-cell">
      <div class="cj-feed">
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

        {{#if @topic.excerpt}}
          <p class="cj-feed__excerpt">
            {{dDirSpan @topic.escapedExcerpt htmlSafe="true"}}
          </p>
        {{/if}}

        <div class="cj-feed__stats">
          <span
            class="cj-feed__stat {{if @topic.liked '--liked'}}"
            title={{i18n "likes_lowercase" count=@topic.like_count}}
          >
            {{dIcon (if @topic.liked "heart" "far-heart")}}
            {{@topic.like_count}}
          </span>

          <span class="cj-feed__stat">
            {{dIcon "far-eye"}}
            {{dNumber @topic.views numberKey="views_long"}}
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
              {{! `leaveAgo` only applies to the medium format — core's
                    formatter ignores it for `tiny`, which is why Horizon's own
                    activity column still reads "5h". Medium is what produces
                    "5 hours ago" / "5 horas atrás" from core's own strings,
                    rather than a preposition glued onto the theme's label,
                    which would read wrong the moment the date turns absolute. }}
              {{dFormatDate @topic.bumpedAt leaveAgo="true" noTitle="true"}}
            </span>
          </a>
        {{/if}}

        {{#if this.showUpdated}}
          <a
            href={{@topic.lastPostUrl}}
            title={{@topic.bumpedAtTitle}}
            class="cj-feed__last-reply"
          >
            {{dIcon "pencil"}}
            <span>
              {{i18n (themePrefix "topic_feed.updated")}}
              {{dFormatDate @topic.bumpedAt leaveAgo="true" noTitle="true"}}
            </span>
          </a>
        {{/if}}
      </div>
    </td>
  </template>
}
