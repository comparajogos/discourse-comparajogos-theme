# frozen_string_literal: true

RSpec.describe "Compara Jogos theme follow-ups" do
  fab!(:user) { Fabricate(:user, trust_level: 1) }
  fab!(:profile_user) { Fabricate(:user, trust_level: 1) }

  let!(:theme) do
    upload_theme.tap do |uploaded|
      uploaded.update_setting(:unified_profile_shell, true)
      uploaded.update_setting(:profile_bridge, false)
    end
  end

  before do
    SiteSetting.hide_new_user_profiles = false
    # Layout tests should not depend on host-specific ImageMagick fonts.
    allow(LetterAvatar).to receive(:generate).and_return(
      Rails.root.join("spec/fixtures/images/logo.png").to_s,
    )
  end

  it "keeps mobile profile identity above the member actions", mobile: true do
    sign_in(user)
    resize_window(width: 390, height: 844) do
      visit("/u/#{profile_user.username}/activity")
      expect(page).to have_css("body.cj-unified-profile-shell .about.collapsed-info")
      expect(page).to have_css(".user-profile-toggle-btn")

      geometry = page.evaluate_script(<<~JS)
        (() => {
          const about = document.querySelector('.about.collapsed-info');
          const rect = (selector) => about.querySelector(selector).getBoundingClientRect();
          const names = rect('.primary-textual');
          const avatar = rect('.user-profile-avatar');
          const controls = rect('.controls');
          const notification = rect('.user-notifications');
          const disclosure = rect('.user-profile-toggle-btn');
          return {
            namesWidth: names.width,
            controlsTop: controls.top,
            identityBottom: Math.max(names.bottom, avatar.bottom),
            actionAlignment: Math.abs(notification.top - disclosure.top),
            bottomClearance: about.getBoundingClientRect().bottom - notification.bottom,
            overflow: document.documentElement.scrollWidth - window.innerWidth
          };
        })()
      JS

      expect(geometry["namesWidth"]).to be > 0
      expect(geometry["controlsTop"]).to be >= geometry["identityBottom"]
      expect(geometry["actionAlignment"]).to be <= 1
      expect(geometry["bottomClearance"]).to be >= 4
      expect(geometry["overflow"]).to be <= 1
    end
  end

  %w[light dark].each do |scheme|
    it "uses the selected #{scheme} map styling even with the opposite OS preference" do
      palette = ColorScheme.find_by!(theme_id: theme.id, name: "Compara Jogos #{scheme.capitalize}")
      palette.update!(user_selectable: true)
      user.user_option.update!(color_scheme_id: palette.id, dark_scheme_id: palette.id)
      sign_in(user)
      page.driver.with_playwright_page do |browser_page|
        browser_page.emulate_media(colorScheme: scheme == "light" ? "dark" : "light")
      end
      visit("/latest")
      expect(page).to have_css("#main-outlet")

      # Only the plugin's CSS contract is needed: no remote map tiles or location data.
      styles = page.evaluate_script(<<~JS)
        (() => {
          const map = document.createElement('div');
          map.className = 'locations-map';
          map.innerHTML = '<div class="leaflet-tile-pane"></div><div class="leaflet-marker-shadow"></div><div class="leaflet-marker-icon"><div><span>3</span></div></div>';
          document.body.append(map);
          const result = {
            filter: getComputedStyle(map.querySelector('.leaflet-tile-pane')).filter,
            shadow: getComputedStyle(map.querySelector('.leaflet-marker-shadow')).display,
            label: getComputedStyle(map.querySelector('.leaflet-marker-icon span')).color,
            inheritedColor: getComputedStyle(map).color,
            osDark: matchMedia('(prefers-color-scheme: dark)').matches
          };
          map.remove();
          return result;
        })()
      JS

      if scheme == "light"
        expect(styles["osDark"]).to eq(true)
        expect(styles["filter"]).to eq("none")
        expect(styles["shadow"]).to eq("block")
        expect(styles["label"]).to eq(styles["inheritedColor"])
      else
        expect(styles["osDark"]).to eq(false)
        expect(styles["filter"]).to include("invert(1)")
        expect(styles["shadow"]).to eq("none")
        expect(styles["label"]).to eq("rgb(0, 0, 0)")
      end
    ensure
      page.driver.with_playwright_page do |browser_page|
        browser_page.emulate_media(colorScheme: "light")
      end
    end
  end
end
