import { apiInitializer } from "discourse/lib/api";
import CjHeaderNav from "../components/cj-header-nav";

export default apiInitializer((api) => {
  if (!settings.show_header_nav) {
    return;
  }

  api.renderInOutlet("before-header-panel", CjHeaderNav);
});
