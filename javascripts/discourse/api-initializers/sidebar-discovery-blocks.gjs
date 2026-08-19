import { apiInitializer } from "discourse/lib/api";
import BlockProductBridge from "../blocks/block-product-bridge";

export default apiInitializer((api) => {
  api.renderBlocks("sidebar-discovery", [
    {
      block: BlockProductBridge,
      id: "compara-jogos-product-bridge",
      args: {
        url: settings.product_url,
        label: "product_bridge.label",
        description: "product_bridge.description",
      },
      conditions: {
        type: "setting",
        source: settings,
        name: "show_product_bridge",
        enabled: true,
      },
    },
  ]);
});
