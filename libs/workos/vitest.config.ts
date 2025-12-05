import { fileURLToPath } from "node:url"
import { defineConfig, type ViteUserConfig } from "vitest/config"

export const commonConfig = {
  hookTimeout: 5_000, // 5 seconds

  fakeTimers: { toFake: undefined },

  setupFiles: [
    fileURLToPath(
      new URL(
        "./vitest.setup.ts",
        import.meta.url
      )
    )
  ]
} as const satisfies ViteUserConfig["test"]

export default defineConfig({
  test: {
    name: "base",
    include: ["test/**/*.test.ts"],
    exclude: ["test/**/*.integration.test.ts"],

    ...commonConfig
  }
})
