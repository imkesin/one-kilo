import { defineConfig } from "@pandacss/dev"

import { accent, grey } from "./src/ui/theme/colorTokens"
import { customUtilities } from "./src/ui/theme/customUtilities/customUtilities"
import { buttonRecipe } from "./src/ui/theme/recipes/buttonRecipe"
import { formInputRecipe } from "./src/ui/theme/recipes/formInputRecipe"
import { formLabelRecipe } from "./src/ui/theme/recipes/formLabelRecipe"

export default defineConfig({
  preflight: true,

  include: [
    "./src/app/**/*.{ts,tsx}",
    "./src/content/**/*.{ts,tsx}",
    "./src/ui/**/*.{ts,tsx}"
  ],

  exclude: [],

  globalCss: {
    html: {
      "--global-font-body": "var(--font-fira-sans)",
      "--global-font-mono": "var(--font-fira-mono)"
    }
  },

  theme: {
    extend: {
      recipes: {
        button: buttonRecipe,
        formInput: formInputRecipe,
        formLabel: formLabelRecipe
      },
      tokens: {
        colors: {
          accent: accent.tokens,
          grey: grey.tokens
        }
      },
      semanticTokens: {
        colors: {
          accent: accent.semanticTokens,
          grey: grey.semanticTokens
        }
      }
    }
  },

  utilities: {
    extend: customUtilities
  },

  jsxFramework: "react",

  outdir: "./src/generated/styled-system"
})
