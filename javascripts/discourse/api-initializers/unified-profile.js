import { computed } from "@ember/object";
import { scheduleOnce } from "@ember/runloop";
import { apiInitializer } from "discourse/lib/api";
import { wantsNewWindow } from "discourse/lib/intercept-click";

const USER_ROUTE = /(?:^|\/)u\/([^/?#]+)/;
const SUMMARY_LINK = ".user-main .user-nav__summary > a";
const SHELL_CLASS = "cj-unified-profile-shell";
const PROFILE_DETAILS_ID = "cj-profile-catalog-details";

export default apiInitializer((api) => {
  const product = (settings.product_url || "").replace(/\/$/, "");
  let profileUsername;
  let profileObserver;

  // A forum identity entry belongs to the forum. Let core resolve every bare
  // user link (including the user card) to Activity before any profile content
  // renders. The visible Summary tab remains the explicit handoff to React.
  api.modifyClass(
    "route:user/index",
    (Superclass) =>
      class extends Superclass {
        get viewingOtherUserDefaultRoute() {
          return settings.unified_profile_shell
            ? "userActivity"
            : super.viewingOtherUserDefaultRoute;
        }
      }
  );

  // Core only offers its profile disclosure when members view themselves.
  // Activity is the unified shell's default route, however, and core keeps
  // every other member collapsed on that route. Preserve the native state,
  // action and translations while making the same disclosure available on
  // viewed profiles instead of leaving their details permanently hidden.
  api.modifyClass(
    "controller:user",
    (Superclass) =>
      class extends Superclass {
        @computed("viewingSelf", "model.profile_hidden")
        get canExpandProfile() {
          return settings.unified_profile_shell
            ? !this.model?.profile_hidden
            : super.canExpandProfile;
        }
      }
  );

  // No current UI emits the native Summary URL after cutover, but old links
  // may still exist. Keep those entries inside Discourse without adding a
  // redundant history item or briefly rendering the native Summary page.
  api.modifyClass(
    "route:user/summary",
    (Superclass) =>
      class extends Superclass {
        beforeModel(...args) {
          if (settings.unified_profile_shell) {
            return this.router.replaceWith("userActivity");
          }

          return super.beforeModel(...args);
        }
      }
  );

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
    if (summaryLink.href) {
      window.location.assign(summaryLink.href);
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
    scheduleOnce("afterRender", null, startProfileSync);
  });
});
