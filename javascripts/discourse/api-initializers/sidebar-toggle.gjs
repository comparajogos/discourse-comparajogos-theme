import { apiInitializer } from "discourse/lib/api";
import CjSidebarToggle from "../components/cj-sidebar-toggle";

export default apiInitializer((api) => {
  api.renderInOutlet("before-main-outlet", CjSidebarToggle);

  api.onPageChange(() => {
    requestAnimationFrame(() => {
      const use = document.querySelector("#toggle-hamburger-menu use");

      use?.setAttribute("href", "#ph-bold-sidebar");
    });
  });
});
