import { settled, visit } from "@ember/test-helpers";
import { test } from "qunit";
import { acceptance } from "discourse/tests/helpers/qunit-helpers";

const TOPIC_URL = "/t/internationalization-localization/280";
const LOGO_SETTINGS = {
  site_logo_small_url: "/images/d-logo-sketch-small.png",
  site_logo_url: "/images/d-logo-sketch.png",
};

async function showTopicInfo(context) {
  await visit(TOPIC_URL);
  context.container.lookup("service:header").mainTopicTitleVisible = false;
  await settled();
}

acceptance("Compara Jogos header logo - desktop", function (needs) {
  needs.settings(LOGO_SETTINGS);

  test("the full wordmark remains beside sticky topic info", async function (assert) {
    await showTopicInfo(this);

    assert.dom(".extra-info-wrapper").exists("topic info is visible");
    assert.dom("#site-logo").hasClass("logo-big");
  });
});

acceptance("Compara Jogos header logo - mobile", function (needs) {
  needs.mobileView();
  needs.settings(LOGO_SETTINGS);

  test("sticky topic info keeps core's compact mark", async function (assert) {
    await showTopicInfo(this);

    assert.dom(".extra-info-wrapper").exists("topic info is visible");
    assert.dom("#site-logo").hasClass("logo-small");
  });
});
