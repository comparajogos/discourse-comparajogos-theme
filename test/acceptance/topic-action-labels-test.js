import { click, settled, visit } from "@ember/test-helpers";
import { test } from "qunit";
import { cloneJSON } from "discourse/lib/object";
import Composer from "discourse/models/composer";
import topicFixtures from "discourse/tests/fixtures/topic";
import { acceptance } from "discourse/tests/helpers/qunit-helpers";
import { i18n } from "discourse-i18n";

acceptance("Compara Jogos contextual reply labels", function (needs) {
  needs.user();
  let tag;
  let canReply;

  needs.hooks.beforeEach(() => {
    tag = null;
    canReply = true;
  });

  needs.pretender((server, helper) => {
    const responseTopic = () => {
      const response = cloneJSON(topicFixtures["/t/280/1.json"]);
      response.tags = tag ? [{ id: 1, name: tag, slug: tag }] : [];
      response.details.can_create_post = canReply;
      return helper.response(response);
    };
    server.get("/t/280.json", responseTopic);
    server.get("/t/280/:post_number.json", responseTopic);
  });

  [
    ["ficha", "review", "submit_review"],
    ["imagem", "submit_images", "submit_images"],
  ].forEach(([topicTag, buttonLabel, composerLabel]) => {
    test(`${topicTag} uses translated labels and the native reply action`, async function (assert) {
      tag = topicTag;
      await visit("/t/internationalization-localization/280");

      assert.dom(".topic-footer-main-buttons .create").exists({ count: 1 });
      assert
        .dom(".cj-contextual-reply")
        .hasText(i18n(themePrefix(`topic_actions.${buttonLabel}`)));
      await click(".cj-contextual-reply");
      assert
        .dom("#reply-control .save-or-cancel .create")
        .hasText(i18n(themePrefix(`topic_actions.${composerLabel}`)));

      const model = this.owner.lookup("service:composer").model;
      assert.strictEqual(model.action, Composer.REPLY);
      assert.strictEqual(model.topic.id, 280);
      model.set("action", Composer.EDIT);
      await settled();
      assert
        .dom("#reply-control .save-or-cancel .create")
        .hasText(i18n("composer.save_edit"));
    });
  });

  test("ordinary topics retain the native reply button", async function (assert) {
    await visit("/t/internationalization-localization/280");
    assert.dom(".cj-contextual-reply").doesNotExist();
    assert
      .dom(".topic-footer-main-buttons .create")
      .hasText(i18n("topic.reply.title"));
  });

  test("contextual labels do not bypass reply permission", async function (assert) {
    tag = "ficha";
    canReply = false;
    await visit("/t/internationalization-localization/280");
    assert.dom(".topic-footer-main-buttons .create").doesNotExist();
  });
});

acceptance(
  "Compara Jogos contextual reply labels (anonymous)",
  function (needs) {
    let tag;

    needs.hooks.beforeEach(() => {
      tag = null;
    });

    needs.pretender((server, helper) => {
      const responseTopic = () => {
        const response = cloneJSON(topicFixtures["/t/280/1.json"]);
        response.tags = tag ? [{ id: 1, name: tag, slug: tag }] : [];
        return helper.response(response);
      };
      server.get("/t/280.json", responseTopic);
      server.get("/t/280/:post_number.json", responseTopic);
    });

    test("ficha shows Avaliar and opens login", async function (assert) {
      tag = "ficha";
      await visit("/t/internationalization-localization/280");

      assert
        .dom(".cj-contextual-reply")
        .hasText(i18n(themePrefix("topic_actions.review")));

      await click(".cj-contextual-reply");
      assert.dom(".login-modal, .d-modal.login-modal, #login-form").exists();
    });

    test("ordinary topics keep core's reply button", async function (assert) {
      await visit("/t/internationalization-localization/280");
      assert.dom(".cj-contextual-reply").doesNotExist();
      assert
        .dom(".topic-footer-main-buttons > .btn-primary")
        .hasText(i18n("topic.reply.title"));
    });
  }
);
