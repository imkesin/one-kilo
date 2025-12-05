import { fileURLToPath } from "url"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"
import { commonConfig } from "./vitest.config.ts"

export default defineConfig(({ mode }) => ({
  test: {
    name: "integration",
    include: ["test/**/*.integration.test.ts"],

    env: loadEnv(
      mode,
      fileURLToPath(new URL(".", import.meta.url)),
      ""
    ),

    ...commonConfig
  }
}))
