import { defineSemanticTokens, defineTokens } from "@pandacss/dev"
import { withDefaultDark, withDefaultDarkOnSemantic } from "./colorScheme"

export const grey = {
  name: "grey",
  tokens: defineTokens.colors(
    withDefaultDark({
      "1": {
        light: { value: "#FBFDFC" },
        dark: { value: "#101211" }
      },
      "2": {
        light: { value: "#F7F9F8" },
        dark: { value: "#171918" }
      },
      "3": {
        light: { value: "#EEF1F0" },
        dark: { value: "#202222" }
      },
      "4": {
        light: { value: "#E6E9E8" },
        dark: { value: "#272A29" }
      },
      "5": {
        light: { value: "#DEE2E1" },
        dark: { value: "#303332" }
      },
      "6": {
        light: { value: "#D7DAD9" },
        dark: { value: "#373B39" }
      },
      "7": {
        light: { value: "#CBCCCE" },
        dark: { value: "#444947" }
      },
      "8": {
        light: { value: "#B8BCBB" },
        dark: { value: "#5B625F" }
      },
      "9": {
        light: { value: "#868E8B" },
        dark: { value: "#63706B" }
      },
      "10": {
        light: { value: "#7C8481" },
        dark: { value: "#717D79" }
      },
      "11": {
        light: { value: "#5F6563" },
        dark: { value: "#ADB5B2" }
      },
      "12": {
        light: { value: "#1A211E" },
        dark: { value: "#ECEEED" }
      }
    })
  ),
  semanticTokens: defineSemanticTokens.colors({
    bg: {
      canvas: {
        DEFAULT: { value: "{colors.grey.1.dark}" },
        light: { value: "{colors.grey.2.light}" },
        dark: { value: "{colors.grey.1.dark}" }
      },
      DEFAULT: {
        DEFAULT: { value: "{colors.grey.2.dark}" },
        light: { value: "{colors.grey.1.light}" },
        dark: { value: "{colors.grey.2.dark}" }
      }
    },
    border: withDefaultDarkOnSemantic({
      subtle: "colors.grey.6",
      DEFAULT: "colors.grey.7",
      active: "colors.grey.8"
    }),
    ...withDefaultDarkOnSemantic({
      DEFAULT: "colors.grey.9",
      emphasized: "colors.grey.10"
    }),
    text: withDefaultDarkOnSemantic({
      DEFAULT: "colors.grey.11",
      emphasized: "colors.grey.12"
    }),
    fg: { value: "white" }
  })
}

export const accent = {
  name: "accent",
  tokens: defineTokens.colors(
    withDefaultDark({
      "1": {
        light: { value: "#F9FEFC" },
        dark: { value: "#0B1310" }
      },
      "2": {
        light: { value: "#F1FCF7" },
        dark: { value: "#121C18" }
      },
      "3": {
        light: { value: "#D9FBEC" },
        dark: { value: "#102D23" }
      },
      "4": {
        light: { value: "#C1F7E1" },
        dark: { value: "#0F3A2C" }
      },
      "5": {
        light: { value: "#A8F0D3" },
        dark: { value: "#164837" }
      },
      "6": {
        light: { value: "#8FE4C3" },
        dark: { value: "#215644" }
      },
      "7": {
        light: { value: "#7BD1B1" },
        dark: { value: "#2C6752" }
      },
      "8": {
        light: { value: "#63B999" },
        dark: { value: "#357D64" }
      },
      "9": {
        light: { value: "#1E5341" },
        dark: { value: "#49A081" }
      },
      "10": {
        light: { value: "#094332" },
        dark: { value: "#3B9375" }
      },
      "11": {
        light: { value: "#1A795D" },
        dark: { value: "#77CDAD" }
      },
      "12": {
        light: { value: "#0D4534" },
        dark: { value: "#B0EFD5" }
      }
    })
  ),
  semanticTokens: defineSemanticTokens.colors({
    border: withDefaultDarkOnSemantic({
      subtle: "colors.accent.6",
      DEFAULT: "colors.accent.7",
      active: "colors.accent.8"
    }),
    ...withDefaultDarkOnSemantic({
      subtle: "colors.accent.8",
      DEFAULT: "colors.accent.9",
      emphasized: "colors.accent.10"
    }),
    text: withDefaultDarkOnSemantic({
      DEFAULT: "colors.accent.11",
      emphasized: "colors.accent.12"
    }),
    fg: { value: "white" }
  })
}
