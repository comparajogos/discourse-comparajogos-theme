import Component from "@glimmer/component";
import { block } from "discourse/blocks";
import dIcon from "discourse/ui-kit/helpers/d-icon";
import { i18n } from "discourse-i18n";

@block("theme:compara-jogos:product-bridge", {
  description: "Compact bridge from the community to the product catalog",
  allowedOutlets: ["sidebar-discovery"],
  args: {
    url: { type: "string", required: true },
    label: { type: "string", required: true },
    description: { type: "string", required: true },
  },
})
export default class BlockProductBridge extends Component {
  <template>
    <a class="cj-product-bridge" href={{@url}}>
      <span class="cj-product-bridge__icon" aria-hidden="true">
        {{dIcon "magnifying-glass"}}
      </span>
      <span class="cj-product-bridge__copy">
        <strong>{{i18n (themePrefix @label)}}</strong>
        <small>{{i18n (themePrefix @description)}}</small>
      </span>
    </a>
  </template>
}
