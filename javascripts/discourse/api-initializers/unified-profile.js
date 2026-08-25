import { scheduleOnce } from "@ember/runloop";
import { apiInitializer } from "discourse/lib/api";
import { wantsNewWindow } from "discourse/lib/intercept-click";

const LEGACY_PROFILE = /(?:^|\/)u\/([^/?#]+)(?:\/summary)?\/?$/;
const USER_ROUTE = /(?:^|\/)u\/([^/?#]+)/;
const SUMMARY_LINK = ".user-main .user-nav__summary > a";
const SHELL_CLASS = "cj-unified-profile-shell";
const PROFILE_DETAILS_ID = "cj-profile-catalog-details";

export default apiInitializer((api) => {
  const product = (settings.product_url || "").replace(/\/$/, "");

  function syncSummaryLink() {
    const match = window.location.pathname.match(USER_ROUTE);
    const summaryLink = document.querySelector(SUMMARY_LINK);

    if (!match || !summaryLink) {
      return;
    }

    summaryLink.href = `${product}/u/${encodeURIComponent(match[1])}`;
  }

  function syncProfileDisclosure() {
    const toggle = document.querySelector(".user-profile-toggle-btn");
    const details = document.getElementById(PROFILE_DETAILS_ID);

    if (!toggle || !details) {
      return;
    }

    const controls = new Set(
      (toggle.getAttribute("aria-controls") || "").split(/\s+/).filter(Boolean)
    );
    controls.add(PROFILE_DETAILS_ID);
    toggle.setAttribute("aria-controls", [...controls].join(" "));
  }

  function openCanonicalSummary(event) {
    if (!settings.unified_profile_shell || !product) {
      return;
    }

    if (!(event.target instanceof Element)) {
      return;
    }

    const summaryLink = event.target.closest(SUMMARY_LINK);
    if (!summaryLink || wantsNewWindow(event, summaryLink)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    window.location.assign(summaryLink.href);
  }

  // Capture before Discourse's internal-link interceptor. The native Summary
  // item remains the single semantic slot, but its destination belongs to the
  // React application outside the forum's `/f` router.
  document.addEventListener("click", openCanonicalSummary, true);

  api.onPageChange((path) => {
    if (!settings.unified_profile_shell || !product) {
      document.body.classList.remove(SHELL_CLASS);
      return;
    }

    document.body.classList.add(SHELL_CLASS);
    const pathname = new URL(path, window.location.origin).pathname;
    const match = pathname.match(LEGACY_PROFILE);

    if (!match) {
      scheduleOnce("afterRender", null, syncSummaryLink);
      scheduleOnce("afterRender", null, syncProfileDisclosure);
      return;
    }

    window.location.replace(`${product}/u/${encodeURIComponent(match[1])}`);
  });
});
