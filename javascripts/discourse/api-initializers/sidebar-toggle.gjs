import { apiInitializer } from "discourse/lib/api";
import CjSidebarToggle from "../components/cj-sidebar-toggle";

export default apiInitializer((api) => {
  api.renderInOutlet("before-main-outlet", CjSidebarToggle);
});
