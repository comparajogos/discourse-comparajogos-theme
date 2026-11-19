# frozen_string_literal: true

RSpec.describe "Channel banner and directory" do
  fab!(:creator, :user)
  fab!(:channel) do
    Fabricate(
      :group,
      name: "mesa-aberta",
      full_name: "Mesa Aberta",
      bio_raw: "Análises, descobertas e histórias sobre jogos de tabuleiro.",
    )
  end
  fab!(:ordinary_group, :group)
  fab!(:publication) do
    Fabricate(:post, user: creator, raw: "Uma nova descoberta para levar à mesa com os amigos.")
  end
  let!(:theme) { upload_theme }

  before do
    SiteSetting.discourse_ai_enabled = true
    SiteSetting.default_locale = "pt_BR"
    SiteSetting.enable_group_directory = true
    SiteSetting.hide_new_user_profiles = false
    channel.add(creator)
    channel.custom_fields["is_channel"] = true
    channel.save_custom_fields
    channel.update!(
      flair_upload: Fabricate(:upload, url: "/images/d-logo-sketch.png", width: 100, height: 100),
    )
    [
      ["entre-dados", "Entre Dados", "Conversas e descobertas para sua próxima partida."],
      [
        "boa-companhia",
        "Jogos em Boa Companhia",
        "Jogos para reunir amigos e criar boas histórias.",
      ],
      ["manual-de-mesa", "Manual de Mesa", "Regras explicadas com calma, do começo ao fim."],
    ].each do |name, title, bio|
      extra = Fabricate(:group, name: name, full_name: title, bio_raw: bio)
      extra.custom_fields["is_channel"] = true
      extra.save_custom_fields
    end
    theme.update!(dark_color_scheme_id: ColorScheme.find_by!(name: "Compara Jogos Dark").id)
    theme.update_setting(:profile_bridge, false)
    allow(LetterAvatar).to receive(:generate).and_return(
      Rails.root.join("spec/fixtures/images/logo.png").to_s,
    )
  end

  it "presents a channel banner and the filtered group directory on desktop and mobile" do
    visit("/t/#{publication.topic.slug}/#{publication.topic_id}")
    expect(page).to have_css(".cj-channel-banner__name", text: channel.full_name)
    expect(page).to have_css(".cj-channel-banner__cta", text: "Visitar canal")
    resize_window(width: 390, height: 844) do
      expect(
        page.evaluate_script("document.documentElement.scrollWidth - window.innerWidth"),
      ).to be <= 1
    end
    page.driver.with_playwright_page { |browser| browser.emulate_media(colorScheme: "dark") }
    visit("/t/#{publication.topic.slug}/#{publication.topic_id}")
    expect(page).to have_css(".cj-channel-banner__name", text: channel.full_name)
    page.driver.with_playwright_page { |browser| browser.emulate_media(colorScheme: "light") }
    visit("/g?is_channel=true")
    expect(page).to have_css(".cj-channel-directory h1", text: "Canais")
    expect(page).to have_css(".group-box", text: channel.full_name)
    expect(page).to have_no_css(".group-box", text: ordinary_group.name)
    expect(page).to have_field("Buscar canais")
    fill_in "Buscar canais", with: "manual"
    expect(page).to have_css(".group-box", count: 1)
    expect(page).to have_css(".group-box", text: "Manual de Mesa")
    fill_in "Buscar canais", with: ""
    expect(page).to have_css(".group-box", count: 4)
    click_link "Todos os grupos"
    expect(page).to have_css(".group-box", text: ordinary_group.name)
    click_link "Canais", exact: true
    expect(page).to have_css(".group-box", count: 4)
    resize_window(width: 390, height: 844) do
      expect(
        page.evaluate_script("document.documentElement.scrollWidth - window.innerWidth"),
      ).to be <= 1
    end
  end
end
