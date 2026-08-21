import { scheduleOnce } from "@ember/runloop";
import { apiInitializer } from "discourse/lib/api";
import renderTag from "discourse/lib/render-tag";

function configuredIconFor(tagName) {
  const template = document.createElement("template");
  template.innerHTML = renderTag(tagName, {}).trim();

  const renderedTag = template.content.firstElementChild;
  const icon = renderedTag?.querySelector(".tag-icon");

  if (!icon) {
    return;
  }

  return {
    color1: renderedTag.style.getPropertyValue("--color1"),
    color2: renderedTag.style.getPropertyValue("--color2"),
    icon,
  };
}

function syncSelectedTagIcons() {
  document
    .querySelectorAll(".tag-drop .select-kit-selected-name")
    .forEach((selection) => {
      selection.querySelector(".cj-selected-tag-icon")?.remove();
      selection.classList.remove("discourse-tag--tag-icons-style");
      selection.style.removeProperty("--color1");
      selection.style.removeProperty("--color2");

      const tagName = selection.dataset.value && selection.dataset.name;
      const configured = tagName && configuredIconFor(tagName);

      if (!configured) {
        return;
      }

      configured.icon.classList.add("cj-selected-tag-icon");
      selection.prepend(configured.icon);
      selection.classList.add("discourse-tag--tag-icons-style");
      selection.style.setProperty("--color1", configured.color1);
      selection.style.setProperty("--color2", configured.color2);
    });
}

export default apiInitializer((api) => {
  api.onPageChange(() => {
    scheduleOnce("afterRender", null, syncSelectedTagIcons);
  });
});
