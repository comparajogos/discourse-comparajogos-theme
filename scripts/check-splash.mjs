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
)}`;
const splashHeader = read("scss/splash/_header.scss");

const sharedGeometry = [
  "--cj-header-shell-height",
  "--cj-header-height",
  "--cj-header-account-size",
  "--cj-header-avatar-size",
  "--cj-header-search-max-width",
  "--cj-header-nav-search-offset",
  "--cj-wordmark-aspect-ratio",
  "--cj-text-sm-size",
  "--cj-text-sm-line-height",
];

for (const token of sharedGeometry) {
  assertIncludes(properties, `${token}:`, "Product geometry");
  assertIncludes(bootedHeader, `var(${token})`, "Hydrated header");
  assertIncludes(splashHeader, `var(${token})`, "Header skeleton");
}

const markup = read("common/header.html");
for (const className of [
  "cj-splash__header",
  "cj-splash__search-control",
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
