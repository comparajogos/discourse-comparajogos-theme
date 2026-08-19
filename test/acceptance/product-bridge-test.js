import { visit } from "@ember/test-helpers";
import { test } from "qunit";
import { acceptance, exists } from "discourse/tests/helpers/qunit-helpers";

acceptance("Compara Jogos product bridge", function () {
  test("it renders in the discovery sidebar", async function (assert) {
    await visit("/latest");

    assert.true(exists(".cj-product-bridge"));
  });
});
