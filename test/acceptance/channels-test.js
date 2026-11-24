import { click, currentURL, triggerEvent, visit } from "@ember/test-helpers";
import { test } from "qunit";
import { cloneJSON } from "discourse/lib/object";
import GroupFixtures from "discourse/tests/fixtures/group-fixtures";
import UserFixtures from "discourse/tests/fixtures/user-fixtures";
import { acceptance } from "discourse/tests/helpers/qunit-helpers";

acceptance("Creator channels", function (needs) {
  needs.settings({ enable_group_directory: true });
  needs.pretender((server, helper) => {
    server.post("https://api.comparajogos.com.br/v1/graphql", () =>
      helper.response({ data: {} })
    );
    server.get("/u/uwe_keim.json", () =>
      helper.response({
        user: {
          groups: [
            {
              id: 101,
              name: "example-channel",
              full_name: "Example channel",
              bio_excerpt:
                'Histórias &amp; <a href="/about">jogos</a> da mesa.',
              is_channel: true,
            },
          ],
        },
      })
    );
    server.get("/u/eviltrout.json", () => {
      const response = cloneJSON(UserFixtures["/u/eviltrout.json"]);
      response.user.groups = [
        {
          id: 101,
          name: "example-channel",
          full_name: "Example channel",
          is_channel: true,
        },
        { id: 102, name: "ordinary-group", is_channel: false },
      ];
      return helper.response(response);
    });
    server.get("/groups/discourse.json", () => {
      const response = cloneJSON(GroupFixtures["/groups/discourse.json"]);
      response.group.is_channel = true;
      response.group.public_exit = true;
      response.group.is_group_user = true;
      response.group.full_name = "Canal de exemplo";
      response.group.bio_cooked = "<p>Conteúdo da equipe</p>";
      return helper.response(response);
    });
    server.get("/topics/groups/discourse.json", (request) => {
      if (request.queryParams.order !== "created") {
        return helper.response({ users: [], topic_list: { topics: [] } });
      }
      return helper.response({
        users: [],
        topic_list: {
          topics: [
            {
              id: 456,
              slug: "publicacao",
              title: "Publicação da equipe",
              created_at: "2026-11-01T12:00:00Z",
              excerpt: "Uma apresentação do jogo.",
              views: 15,
              image_url:
                "https://uploads.comparajogos.com.br/optimized/1X/share.jpeg",
              posters: [],
            },
            {
              id: 457,
              slug: "texto",
              title: "Texto da equipe",
              created_at: "2026-10-01T12:00:00Z",
              excerpt: "Uma análise sem imagem.",
              posters: [],
            },
          ],
        },
      });
    });
  });

  test("channel opens with publications and preserves the team view", async function (assert) {
    await visit("/g/discourse");
    assert
      .dom(".cj-channel-page h1")
      .hasText("Canal de exemplo", "uses the channel identity");
    assert
      .dom(".cj-channel-page .cj-feed__title")
      .hasText(
        "Publicação da equipe",
        "loads topics from the group's native endpoint as feed rows"
      );
    assert
      .dom(".cj-channel-page img.cj-feed__media")
      .hasAttribute(
        "src",
        "https://uploads.comparajogos.com.br/_/w384/plain/optimized/1X/share.jpeg",
        "serves the card through the imgproxy preset instead of the share image"
      )
      .hasAttribute(
        "srcset",
        "https://uploads.comparajogos.com.br/_/w384/plain/optimized/1X/share.jpeg 384w, https://uploads.comparajogos.com.br/_/w828/plain/optimized/1X/share.jpeg 828w",
        "offers a larger preset for wide or high-density cards"
      );
    assert
      .dom(".cj-channel-page .cj-feed__tile")
      .hasText(
        "Uma análise sem imagem.",
        "text-only publications show their excerpt in place of a thumbnail"
      );
    assert
      .dom(".cj-channel-page .cj-feed__author")
      .doesNotExist("the channel already names its author");
    assert
      .dom(".cj-channel-page .cj-feed__byline .cj-feed__stats")
      .exists("stats share the date's line");
    await click('.cj-channel-page__nav a[href*="channel_team=true"]');
    assert
      .dom(".cj-channel-page")
      .hasAttribute("data-view", "team", "selects the team view");
    assert
      .dom(".cj-channel-page .cj-feed")
      .doesNotExist("does not mix publications with the team table");
    assert.dom(".group-members").exists("retains the native member list");
    assert
      .dom(".cj-channel-page .group-index-leave")
      .exists("keeps the native leave-team action");
    assert.strictEqual(
      currentURL(),
      "/g/discourse?channel_team=true",
      "team view can be linked directly"
    );
  });

  test("a broken thumbnail falls back to the excerpt tile", async function (assert) {
    await visit("/g/discourse");
    await triggerEvent(".cj-channel-page img.cj-feed__media", "error");

    assert.dom(".cj-channel-page img.cj-feed__media").doesNotExist();
    assert.dom(".cj-channel-page .cj-feed__tile").exists({ count: 2 });
  });

  test("profile links only to channel groups", async function (assert) {
    await visit("/u/eviltrout/activity");
    assert
      .dom('.cj-channel-links a[href="/g/example-channel"]')
      .exists("links the profile to its channel");
    assert
      .dom('.cj-channel-links a[href="/g/ordinary-group"]')
      .doesNotExist("does not promote ordinary groups to channels");
  });

  test("opening post links to the channel without branding replies", async function (assert) {
    await visit("/t/internationalization-localization/280");
    assert
      .dom('#post_1 .cj-channel-banner[href="/g/example-channel"]')
      .exists("links the opening post to the author's channel");
    assert
      .dom("#post_1 .cj-channel-banner__description")
      .hasText("Histórias & jogos da mesa.");
    assert
      .dom("#post_1 .cj-channel-banner__description a")
      .doesNotExist("does not nest links inside the banner");
    assert
      .dom("#post_2 .cj-channel-links--publication")
      .doesNotExist("does not label replies as channel publications");
  });

  test("ordinary groups keep the native page", async function (assert) {
    await visit("/g/moderators");
    assert
      .dom(".cj-channel-page")
      .doesNotExist("does not change ordinary groups");
  });
});
