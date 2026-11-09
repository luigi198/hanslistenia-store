import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

// Layer boundaries (see CLAUDE.md → Architecture). Tested in
// src/architecture/boundaries.test.ts.

const layer = (name, message) => ({
  group: [`@/${name}`, `@/${name}/*`, `**/${name}`, `**/${name}/*`],
  message,
});

const UI_FRAMEWORK = {
  group: ["next", "next/*", "react", "react-dom"],
  message: "This layer must not depend on the UI framework.",
};
const STORAGE_VENDORS = {
  group: ["mongodb", "@aws-sdk/*", "resend"],
  message:
    "Only storage/ may use storage vendors; depend on a domain port instead.",
};

const restrict = (files, patterns) => ({
  files,
  rules: { "no-restricted-imports": ["error", { patterns }] },
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  restrict(
    ["src/app/**/*.{ts,tsx}"],
    [
      STORAGE_VENDORS,
      layer(
        "storage",
        "app/ must not use storage/ directly; go through @/composition.",
      ),
    ],
  ),
  restrict(
    ["src/domain/**/*.{ts,tsx}"],
    [
      UI_FRAMEWORK,
      STORAGE_VENDORS,
      layer("app", "domain/ must not import app/."),
      layer("storage", "domain/ must not import storage/; define a port."),
      layer(
        "config",
        "domain/ must not read config; receive values via parameters.",
      ),
      layer("composition", "domain/ must not import the composition root."),
    ],
  ),
  restrict(
    ["src/storage/**/*.{ts,tsx}"],
    [
      layer("app", "storage/ must not import app/."),
      layer("composition", "storage/ must not import the composition root."),
      {
        // Regex, not globs: gitignore-style globs cannot re-include
        // domain/ports once domain/* is excluded.
        regex: "(^|/)domain(/(?!ports(/|$)).*)?$",
        message: "storage/ may only import interfaces from @/domain/ports.",
      },
    ],
  ),
  restrict(
    ["src/shared/**/*.{ts,tsx}"],
    [
      UI_FRAMEWORK,
      STORAGE_VENDORS,
      ...["app", "domain", "storage", "config", "composition"].map((name) =>
        layer(name, "shared/ must stay dependency-free."),
      ),
    ],
  ),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
