import { apiInitializer } from "discourse/lib/api";

export default apiInitializer((api) => {
  if (!settings.use_sidebar_chevrons) {
    return;
  }

  const updateIcon = () => {
    const sidebarIsOpen = document.body.classList.contains("has-sidebar-page");
    const icon = sidebarIsOpen ? "chevron-left" : "chevron-right";

    document
      .querySelectorAll(".header-sidebar-toggle .d-icon use")
      .forEach((element) => element.setAttribute("href", `#${icon}`));
  };

  const observer = new MutationObserver((mutations) => {
    if (mutations.some(({ attributeName }) => attributeName === "class")) {
      requestAnimationFrame(updateIcon);
    }
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });

  api.onAppEvent("page:changed", () => requestAnimationFrame(updateIcon));
  requestAnimationFrame(updateIcon);
});
