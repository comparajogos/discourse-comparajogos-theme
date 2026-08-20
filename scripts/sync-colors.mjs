import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const checkOnly = process.argv.includes("--check");
const colors = JSON.parse(await readFile(`${root}design/colors.json`, "utf8"));
const { light, dark } = colors.schemes;

function hex(value) {
  const short = value.match(/^([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$/i);

  return short ? `#${short.slice(1).join("")}` : `#${value}`;
}

function replaceBlock(source, name, lines) {
  const start = `/* color-contract:${name}:start */`;
  const end = `/* color-contract:${name}:end */`;
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Missing ${name} color contract markers`);
  }

  const lineStart = source.lastIndexOf("\n", startIndex) + 1;
  const indentation = source.slice(lineStart, startIndex);
  const body = lines
    .map((line) => (line ? `${indentation}${line}` : ""))
    .join("\n");

  return `${source.slice(0, startIndex)}${start}\n${body}\n${indentation}${source.slice(endIndex)}`;
}

function colorDefinitions() {
  const pair = (name) =>
    `#{dark-light-choose(${light.product[name]}, ${dark.product[name]})}`;

  return `/*
 * Generated from design/colors.json by scripts/sync-colors.mjs.
 * This file is compiled once per Discourse color scheme. Do not edit it by hand.
 */

:root {
  /* React --background */
  --cj-background: ${pair("background")};

  /* React --card */
  --cj-card: #{dark-light-choose(
      ${light.product.card},
      ${dark.product.card}
    )};

  /* React --input / --secondary */
  --cj-control: ${pair("control")};

  /* React --border */
  --cj-border: #{dark-light-choose(
      ${light.product.border},
      ${dark.product.border}
    )};

  /* React FeaturedSection: bg-white dark:bg-black */
  --cj-header: #{dark-light-choose(${hex(light.discourse.header_background)}, ${hex(dark.discourse.header_background)})};

  /* React --muted-foreground */
  --cj-text-muted: ${pair("textMuted")};

  /* React header search and navigation: --muted light, --card dark */
  --cj-header-soft: #{dark-light-choose(
      ${light.product.headerSoft},
      ${dark.product.headerSoft}
    )};
}
`;
}

const generated = new Map();

const aboutPath = `${root}about.json`;
const about = JSON.parse(await readFile(aboutPath, "utf8"));
about.color_schemes = {
  [light.name]: light.discourse,
  [dark.name]: dark.discourse,
};
generated.set(aboutPath, `${JSON.stringify(about, null, 2)}\n`);

generated.set(`${root}common/color_definitions.scss`, colorDefinitions());

const propertiesPath = `${root}scss/properties.scss`;
const properties = await readFile(propertiesPath, "utf8");
generated.set(
  propertiesPath,
  replaceBlock(properties, "shared", [
    "",
    `/* Live presence is fixed across schemes, matching the React client. */`,
    `--cj-online: ${colors.shared.online};`,
    `--cj-on-action: ${colors.shared.onAction};`,
    `--cj-focus-ring: ${colors.shared.focusRing};`,
    "",
  ])
);

const stale = [];

for (const [path, expected] of generated) {
  const current = await readFile(path, "utf8");

  if (current === expected) {
    continue;
  }

  if (checkOnly) {
    stale.push(path.slice(root.length));
  } else {
    await writeFile(path, expected);
  }
}

if (stale.length > 0) {
  process.stderr.write(
    `Color contract is stale:\n${stale.map((path) => `- ${path}`).join("\n")}\n`
  );
  process.stderr.write(
    "Run pnpm sync:colors and commit the generated files.\n"
  );
  process.exitCode = 1;
} else if (!checkOnly) {
  process.stdout.write("Synchronized the color contract.\n");
}
