import { apiInitializer } from "discourse/lib/api";

export default apiInitializer((api) => {
  const site = api.container.lookup("service:site");
  const applicationController = api.container.lookup("controller:application");

  api.onPageChange(() => {
    requestAnimationFrame(() => {
      if (!site.mobileView) {
        const sidebarIsAvailable = document.querySelector(
          ".d-header .header-sidebar-toggle"
        );

        if (
          sidebarIsAvailable &&
          !document.body.classList.contains("has-sidebar-page")
        ) {
          applicationController.toggleSidebar();
        }

        return;
      }

      const use = document.querySelector("#toggle-hamburger-menu use");

      use?.setAttribute("href", "#ph-bold-sidebar");
    });
  });
});
