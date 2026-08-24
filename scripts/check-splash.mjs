import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

function assertIncludes(source, fragment, label) {
  if (!source.includes(fragment)) {
    throw new Error(`${label} is missing ${fragment}`);
  }
}

const manifest = read("scss/_splash.scss");
const expectedImports = [
  "splash/base",
  "splash/header",
  "splash/chrome",
  "splash/routes",
  "splash/discovery",
  "splash/tab-bar",
  "splash/responsive",
];

let previousImport = -1;
for (const partial of expectedImports) {
  const statement = `@import "${partial}";`;
  const index = manifest.indexOf(statement);
  if (index === -1) {
    throw new Error(`Splash manifest is missing ${statement}`);
  }
  if (index < previousImport) {
    throw new Error(`Splash cascade order changed at ${statement}`);
  }
  previousImport = index;
}

const properties = read("scss/properties.scss");
const bootedHeader = `${read("scss/_header.scss")}\n${read(
  "scss/_header-search.scss"
)}\n${read("scss/_header-nav.scss")}`;
const splashHeader = `${read("scss/splash/_header.scss")}\n${read(
  "scss/splash/_responsive.scss"
)}`;
const splashChrome = read("scss/splash/_chrome.scss");

const sharedGeometry = [
  "--cj-header-shell-height",
  "--cj-header-height",
  "--cj-header-account-size",
  "--cj-header-avatar-size",
  "--cj-header-search-max-width",
  "--cj-header-nav-search-offset",
  "--cj-header-market-caret-size",
  "--cj-mobile-header-market-width",
  "--cj-mobile-header-market-height",
  "--cj-mobile-header-search-market-gap",
  "--cj-wordmark-aspect-ratio",
  "--cj-text-sm-size",
  "--cj-text-sm-line-height",
];

for (const token of sharedGeometry) {
  assertIncludes(properties, `${token}:`, "Product geometry");
  assertIncludes(bootedHeader, `var(${token})`, "Hydrated header");
  assertIncludes(splashHeader, `var(${token})`, "Header skeleton");
}

for (const declaration of [
  "--cj-header-account-size: 2.5rem",
  "--cj-header-avatar-size: 2rem",
  "--cj-mobile-header-market-width: 3rem",
  "--cj-mobile-header-market-height: 2.25rem",
  "--cj-mobile-header-search-market-gap: var(--space-3)",
]) {
  assertIncludes(properties, declaration, "Mobile header geometry");
}

assertIncludes(
  bootedHeader,
  "height: var(--cj-header-height);",
  "Hydrated header height"
);
assertIncludes(
  splashHeader,
  "height: var(--cj-header-height);",
  "Skeleton header height"
);

assertIncludes(properties, "--cj-sidebar-top-padding:", "Product geometry");
assertIncludes(
  properties,
  "--sidebar-section-wrapper-padding: var(--cj-sidebar-top-padding)",
  "Hydrated sidebar"
);
assertIncludes(
  splashChrome,
  "var(--cj-sidebar-top-padding)",
  "Sidebar skeleton"
);

const markup = read("common/header.html");
for (const className of [
  "cj-splash__header",
  "cj-splash__search-control",
  "cj-splash__market-caret",
  "cj-splash__auth",
  "cj-splash__sidebar",
  "cj-splash__topic",
  "cj-splash__generic",
  "cj-splash__cards",
  "cj-splash__tab-bar",
]) {
  assertIncludes(markup, className, "Skeleton markup");
}

const cardCount = markup.match(/class="cj-splash__card"/g)?.length ?? 0;
if (cardCount !== 8) {
  throw new Error(`Expected 8 first-paint cards, found ${cardCount}`);
}

process.stdout.write(
  "Splash structure and shared geometry are synchronized.\n"
);
