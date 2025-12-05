import nextVitals from "eslint-config-next/core-web-vitals"
import { defineConfig, globalIgnores } from "eslint/config"
import baseConfig from "../../eslint.config.mjs"

export default defineConfig([
  ...baseConfig,
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts"
  ]),
  {
    rules: {
      "react/no-unescaped-entities": "off"
    }
  }
])
