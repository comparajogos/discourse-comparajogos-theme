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
  let profileUsername;
  let profileObserver;

  function syncSummaryLink() {
    const summaryLink = document.querySelector(SUMMARY_LINK);

    if (!profileUsername || !summaryLink) {
      return;
    }

    const href = `${product}/u/${encodeURIComponent(profileUsername)}`;

    if (summaryLink.href !== href) {
      summaryLink.href = href;
    }
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
    const ariaControls = [...controls].join(" ");

    if (toggle.getAttribute("aria-controls") !== ariaControls) {
      toggle.setAttribute("aria-controls", ariaControls);
    }
  }

  function stopProfileSync() {
    profileObserver?.disconnect();
    profileObserver = null;
  }

  function startProfileSync() {
    stopProfileSync();

    if (
      !settings.unified_profile_shell ||
      !document.body.classList.contains(SHELL_CLASS) ||
      !profileUsername
    ) {
      return;
    }

    profileObserver = new MutationObserver(() => {
      syncSummaryLink();
      syncProfileDisclosure();
    });
    profileObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-controls"],
      childList: true,
      subtree: true,
    });

    syncSummaryLink();
    syncProfileDisclosure();
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
    if (profileUsername) {
      window.location.assign(
        `${product}/u/${encodeURIComponent(profileUsername)}`
      );
    }
  }

  // Capture before Discourse's internal-link interceptor. The native Summary
  // item remains the single semantic slot, but its destination belongs to the
  // React application outside the forum's `/f` router.
  document.addEventListener("click", openCanonicalSummary, true);

  api.onPageChange((path) => {
    stopProfileSync();
    profileUsername = null;

    const pathname = new URL(path, window.location.origin).pathname;
    const userMatch = pathname.match(USER_ROUTE);

    if (!settings.unified_profile_shell || !product || !userMatch) {
      document.body.classList.remove(SHELL_CLASS);
      return;
    }

    document.body.classList.add(SHELL_CLASS);
    profileUsername = userMatch[1];
    const match = pathname.match(LEGACY_PROFILE);

    if (!match) {
      scheduleOnce("afterRender", null, startProfileSync);
      return;
    }

    window.location.replace(`${product}/u/${encodeURIComponent(match[1])}`);
  });
});
