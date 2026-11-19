# frozen_string_literal: true

RSpec.describe "Creator channel page" do
  fab!(:creator, :user)
  fab!(:channel) do
    Fabricate(
      :group,
      name: "mesa-aberta",
      full_name: "Mesa Aberta",
      bio_raw: "Análises e histórias sobre jogos de tabuleiro.",
    )
  end
  fab!(:publication) do
    Fabricate(:post, user: creator, raw: "Uma análise para descobrir novas formas de jogar.")
  end

  let!(:theme) { upload_theme }

  before do
    channel.add(creator)
    channel.custom_fields["is_channel"] = true
    channel.save_custom_fields
    theme.update_setting(:profile_bridge, false)
    allow(LetterAvatar).to receive(:generate).and_return(
      Rails.root.join("spec/fixtures/images/logo.png").to_s,
    )
  end

  it "shows publications and the existing team without overflowing on mobile" do
    visit("/g/#{channel.name}")
    expect(page).to have_css(".cj-channel-page h1", text: channel.full_name)
    expect(page).to have_css(".cj-channel-publication h2", text: publication.topic.title)
    expect(page).to have_no_css(".group-members")

    resize_window(width: 390, height: 844) do
      expect(page).to have_css(".cj-channel-publication")
      expect(
        page.evaluate_script("document.documentElement.scrollWidth - window.innerWidth"),
      ).to be <= 1
      find('.cj-channel-page__nav a[href*="channel_team=true"]').click
      expect(page).to have_current_path("/g/#{channel.name}?channel_team=true")
      expect(page).to have_css(".group-members", text: creator.username)
      expect(page).to have_no_css(".cj-channel-publication")
      page.refresh
      expect(page).to have_css(".group-members", text: creator.username)
    end
  end
end
