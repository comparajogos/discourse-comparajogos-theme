import { apiInitializer } from "discourse/lib/api";
import renderTag from "discourse/lib/render-tag";

const ICON_NAME = /\bclass=["'][^"']*\bd-icon-([^\s"']+)/i;

/* Tag Icons owns the mapping by replacing renderTag. Its SVG keeps the icon
 * name in a d-icon-* class even when another component maps the sprite symbol
 * to Phosphor, so passing that name back through dIcon preserves the full icon
 * replacement chain. */

function configuredIconFor(tagName) {
  const renderedTag = renderTag(tagName, {
    noHref: true,
    tagName: "span",
  });

  return renderedTag.match(ICON_NAME)?.[1];
}

export default apiInitializer((api) => {
  api.modifyClass(
    "component:tag-drop",
    (Superclass) =>
      class extends Superclass {
        modifySelection(content) {
          const selection = super.modifySelection(content);
          const tagName = selection && this.getName(selection);
          const icon = tagName && configuredIconFor(tagName);

          return icon ? { ...selection, icon } : selection;
        }
      }
  );
});
