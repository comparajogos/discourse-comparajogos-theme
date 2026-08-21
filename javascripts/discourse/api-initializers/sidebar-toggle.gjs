import { scheduleOnce } from "@ember/runloop";
import { apiInitializer } from "discourse/lib/api";
import Mobile from "discourse/lib/mobile";

export default apiInitializer((api) => {
  const capabilities = api.container.lookup("service:capabilities");
  const applicationController = api.container.lookup("controller:application");

  function syncSidebarToggle() {
    if (capabilities.viewport.sm && !Mobile.mobileForced) {
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
  }

  api.onPageChange(() => {
    scheduleOnce("afterRender", null, syncSidebarToggle);
  });
});
