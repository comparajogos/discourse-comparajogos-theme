import { apiInitializer } from "discourse/lib/api";
import { i18n } from "discourse-i18n";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function createCaret() {
  const icon = document.createElementNS(SVG_NAMESPACE, "svg");
  const use = document.createElementNS(SVG_NAMESPACE, "use");

  icon.classList.add("d-icon", "cj-list-controls-toggle__icon");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("width", "1em");
  icon.setAttribute("height", "1em");
  icon.append(use);

  return { icon, use };
}

export default apiInitializer((api) => {
  const site = api.container.lookup("service:site");
  let collapsed = false;

  function applyState(controls, button, use) {
    const label = i18n(
      themePrefix(collapsed ? "list_controls.expand" : "list_controls.collapse")
    );

    controls.classList.toggle("is-collapsed", collapsed);
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute("aria-label", label);
    button.title = label;
    use.setAttribute(
      "href",
      collapsed ? "#ph-bold-caret-down" : "#ph-bold-caret-up"
    );
  }

  function installToggle() {
    const controls = document.querySelector(".list-controls");
    const navigation = controls?.querySelector(".navigation-container");
    const categoryFilter = navigation?.querySelector(".category-breadcrumb");
    const orderingFilter = navigation?.querySelector("#navigation-bar");

    if (!controls || !navigation || !categoryFilter || !orderingFilter) {
      return;
    }

    categoryFilter.id ||= "cj-list-scope-controls";

    const controlledIds = [categoryFilter.id, orderingFilter.id].join(" ");
    const existing = controls.querySelector(
      ":scope > .cj-list-controls-toggle"
    );

    if (existing) {
      const use = existing.querySelector("use");

      existing.setAttribute("aria-controls", controlledIds);

      if (use) {
        applyState(controls, existing, use);
      }

      return;
    }

    const button = document.createElement("button");
    const { icon, use } = createCaret();

    button.className = "btn no-text btn-icon cj-list-controls-toggle";
    button.type = "button";
    button.setAttribute("aria-controls", controlledIds);
    button.append(icon);
    button.addEventListener("click", () => {
      collapsed = !collapsed;
      applyState(controls, button, use);
    });

    controls.append(button);
    applyState(controls, button, use);
  }

  api.onPageChange(() => {
    if (!site.mobileView) {
      return;
    }

    requestAnimationFrame(() => requestAnimationFrame(installToggle));
  });
});
