import { apiInitializer } from "discourse/lib/api";
import CjHeaderSearch from "../components/cj-header-search";

export default apiInitializer((api) => {
  if (!settings.mobile_header_search) {
    return;
  }

  api.renderInOutlet("before-header-panel", CjHeaderSearch);
});
