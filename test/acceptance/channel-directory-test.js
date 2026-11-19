import { click, currentURL, fillIn, visit } from "@ember/test-helpers";
import { test } from "qunit";
import { acceptance } from "discourse/tests/helpers/qunit-helpers";

acceptance("Channel directory", function (needs) {
  needs.settings({ enable_group_directory: true });
  needs.pretender((server, helper) => {
    const directory = (request) => {
      const channel = {
        id: 100,
        name: "mesa-aberta",
        full_name: "Mesa Aberta",
        is_channel: true,
        user_count: 2,
        bio_excerpt: "Histórias da mesa.",
        automatic: false,
      };
      const ordinary = {
        id: 101,
        name: "ordinary",
        full_name: "Ordinary group",
        is_channel: false,
        user_count: 1,
        automatic: false,
      };
      let groups =
        request.queryParams.is_channel === "true"
          ? [channel]
          : [channel, ordinary];
      if (request.queryParams.filter) {
        groups = groups.filter((group) =>
          group.name.includes(request.queryParams.filter)
        );
      }
      return helper.response({
        groups,
        total_rows_groups: groups.length,
        extras: { type_filters: [] },
      });
    };
    server.get("/groups.json", directory);
    server.get("/groups", directory);
  });

  test("filters the native directory and preserves search and the creation link", async function (assert) {
    await visit("/g?is_channel=true");
    assert
      .dom('.cj-channel-directory[data-channels="true"] h1')
      .hasText("Channels", "labels the channel directory");
    assert
      .dom('.group-box[data-group-name="mesa-aberta"]')
      .exists("renders the native group card");
    assert
      .dom('.group-box[data-group-name="ordinary"]')
      .doesNotExist("only requests channels");
    assert
      .dom(".cj-channel-directory__heading .btn")
      .hasAttribute(
        "href",
        "/workflows/form/631f8c1c-82a0-42f5-91db-a52b4d3904d9",
        "opens the existing form"
      );
    await fillIn(".cj-channel-directory__search", "no-match");
    assert.dom(".group-box").doesNotExist("uses native search");
    assert.true(
      currentURL().includes("is_channel=true"),
      "search keeps the channel filter"
    );
    await fillIn(".cj-channel-directory__search", "");
    assert
      .dom('.group-box[data-group-name="mesa-aberta"]')
      .exists("clearing search restores channels");
    await click(".cj-channel-directory__nav a:last-child");
    assert.strictEqual(
      currentURL(),
      "/g",
      "clears the channel query parameter"
    );
    assert
      .dom('.group-box[data-group-name="ordinary"]')
      .exists("switching back restores ordinary groups");
  });
});
