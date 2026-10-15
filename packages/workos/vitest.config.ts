import { fileURLToPath } from "node:url"
import { loadEnv } from "vite"
import { defineConfig, type ViteUserConfig } from "vitest/config"

export const commonConfig = {
  hookTimeout: 5_000, // 5 seconds

  setupFiles: [
    fileURLToPath(
      new URL(
        "./vitest.setup.ts",
        import.meta.url
      )
    )
  ]
} as const satisfies ViteUserConfig["test"]

export default defineConfig(({ mode }) => ({
  test: {
    name: "base",
    include: ["test/**/*.test.ts"],
    exclude: ["test/**/*.integration.test.ts"],

    env: loadEnv(
      mode,
      fileURLToPath(new URL(".", import.meta.url)),
      ""
    ),

    ...commonConfig
  }
}))
