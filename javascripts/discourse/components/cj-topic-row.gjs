import Component from "@glimmer/component";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import PluginOutlet from "discourse/components/plugin-outlet";
import ActionList from "discourse/components/topic-list/action-list";
import NewRepliesDot from "discourse/components/topic-list/new-replies-dot";
import ParticipantGroups from "discourse/components/topic-list/participant-groups";
import TopicExcerpt from "discourse/components/topic-list/topic-excerpt";
import TopicLink from "discourse/components/topic-list/topic-link";
import TopicPostBadges from "discourse/components/topic-post-badges";
import TopicStatus from "discourse/components/topic-status";
import lazyHash from "discourse/helpers/lazy-hash";
import topicFeaturedLink from "discourse/helpers/topic-featured-link";
import { groupPath } from "discourse/lib/url";
import DUserLink from "discourse/ui-kit/d-user-link";
import dAvatar from "discourse/ui-kit/helpers/d-avatar";
import dCategoryLink from "discourse/ui-kit/helpers/d-category-link";
import dDiscourseTags from "discourse/ui-kit/helpers/d-discourse-tags";
import dFormatDate from "discourse/ui-kit/helpers/d-format-date";
import dIcon from "discourse/ui-kit/helpers/d-icon";
import dNumber from "discourse/ui-kit/helpers/d-number";
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
  get participantGroups() {
    return (this.args.topic.participant_groups || []).map((name) => ({
      name,
      url: groupPath(name),
    }));
  }

  @action
  onTitleFocus(event) {
    event.target.closest(".topic-list-item").classList.add("selected");
  }

  @action
  onTitleBlur(event) {
    event.target.closest(".topic-list-item").classList.remove("selected");
  }

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
        <PluginOutlet
          @name="topic-list-before-link"
          @outletArgs={{lazyHash topic=@topic}}
        />
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

          <div class="cj-feed__taxonomy">
            <PluginOutlet
              @name="topic-list-topic-cell-link-bottom-line"
              @outletArgs={{lazyHash topic=@topic tagsForUser=@tagsForUser}}
            >
              <PluginOutlet
                @name="topic-list-before-category"
                @outletArgs={{lazyHash topic=@topic}}
              />
              {{#unless @hideCategory}}
                {{#unless @topic.isPinnedUncategorized}}
                  {{dCategoryLink @topic.category}}
                {{/unless}}
              {{/unless}}
              <PluginOutlet
                @name="topic-list-after-category"
                @outletArgs={{lazyHash topic=@topic}}
              />
              {{dDiscourseTags @topic mode="list" tagsForUser=@tagsForUser}}
              {{#if this.participantGroups}}
                <ParticipantGroups @groups={{this.participantGroups}} />
              {{/if}}
              <ActionList
                @topic={{@topic}}
                @postNumbers={{@topic.liked_post_numbers}}
                @icon="heart"
                class="likes"
              />
            </PluginOutlet>
          </div>

          <PluginOutlet
            @name="topic-list-before-status"
            @outletArgs={{lazyHash topic=@topic}}
          />
          <TopicStatus @topic={{@topic}} @context="topic-list" />
        </div>

        <div
          class="cj-feed__title topic-list-main-link"
          role="heading"
          aria-level="2"
        >
          <PluginOutlet
            @name="topic-list-topic-cell-link-top-line"
            @outletArgs={{lazyHash topic=@topic tagsForUser=@tagsForUser}}
          >
            <TopicLink
              {{on "focus" this.onTitleFocus}}
              {{on "blur" this.onTitleBlur}}
              @topic={{@topic}}
              class="raw-link raw-topic-link"
            />
            {{#if @topic.featured_link}}
              {{topicFeaturedLink @topic}}
            {{/if}}
            <PluginOutlet
              @name="topic-list-after-title"
              @outletArgs={{lazyHash topic=@topic}}
            />
            {{#if @topic.is_nested_view}}
              {{#if @topic.has_new_replies}}
                <NewRepliesDot @topic={{@topic}} />
              {{/if}}
            {{else if @showTopicPostBadges}}
              <TopicPostBadges
                @unreadPosts={{@topic.unread_posts}}
                @unseen={{@topic.unseen}}
                @url={{@topic.lastUnreadUrl}}
              />
            {{/if}}
            <PluginOutlet
              @name="topic-list-after-badges"
              @outletArgs={{lazyHash topic=@topic}}
            />
          </PluginOutlet>
        </div>

        {{#if @expandPinned}}
          <div class="cj-feed__excerpt">
            <TopicExcerpt @topic={{@topic}} />
          </div>
        {{/if}}

        <PluginOutlet
          @name="topic-list-main-link-bottom"
          @outletArgs={{lazyHash topic=@topic expandPinned=@expandPinned}}
        />

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
            <PluginOutlet
              @name="topic-list-before-view-count"
              @outletArgs={{lazyHash topic=@topic}}
            />
            {{dNumber @topic.views numberKey="views_long"}}
          </span>

          <a
            class="cj-feed__stat badge-posts"
            href={{@topic.firstPostUrl}}
            aria-label={{i18n "topic.reply_count_link" count=@topic.replyCount}}
          >
            {{dIcon "far-comment"}}
            <PluginOutlet
              @name="topic-list-before-reply-count"
              @outletArgs={{lazyHash topic=@topic}}
            />
            {{dNumber @topic.replyCount noTitle="true"}}
          </a>

        </div>

        {{#if this.showLastReply}}
          <a
            href={{@topic.lastPostUrl}}
            title={{@topic.bumpedAtTitle}}
            class="cj-feed__last-reply post-activity"
          >
            {{dIcon "reply"}}
            <span class="cj-feed__last-reply-name">
              {{this.lastPoster.username}}
            </span>
            <span>
              {{i18n (themePrefix "topic_feed.replied")}}
              <PluginOutlet
                @name="topic-list-before-relative-date"
                @outletArgs={{lazyHash topic=@topic}}
              />
              {{dFormatDate
                @topic.bumpedAt
                format="medium"
                leaveAgo="true"
                noTitle="true"
              }}
            </span>
          </a>
        {{/if}}

        {{#if this.showUpdated}}
          <a
            href={{@topic.lastPostUrl}}
            title={{@topic.bumpedAtTitle}}
            class="cj-feed__last-reply post-activity"
          >
            {{dIcon "pencil"}}
            <span>
              {{i18n (themePrefix "topic_feed.updated")}}
              <PluginOutlet
                @name="topic-list-before-relative-date"
                @outletArgs={{lazyHash topic=@topic}}
              />
              {{dFormatDate
                @topic.bumpedAt
                format="medium"
                leaveAgo="true"
                noTitle="true"
              }}
            </span>
          </a>
        {{/if}}
      </div>
    </td>
  </template>
}
