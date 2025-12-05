import { defineUtility } from "@pandacss/dev"
import { createLightDarkColorTransform } from "./internal/createLightDarkColorTransform"

const lightDarkBgUtility = defineUtility({
  group: "Background",
  shorthand: "lightDarkBg",
  transform: createLightDarkColorTransform("background"),
  values: "colors"
})
const lightDarkGradientFromUtility = defineUtility({
  group: "Background",
  shorthand: "lightDarkGradientFrom",
  transform: createLightDarkColorTransform("--gradient-from"),
  values: "colors"
})
const lightDarkGradientToUtility = defineUtility({
  group: "Background",
  shorthand: "lightDarkGradientTo",
  transform: createLightDarkColorTransform("--gradient-to"),
  values: "colors"
})

const lightDarkColorUtility = defineUtility({
  group: "Color",
  shorthand: "lightDarkColor",
  transform: createLightDarkColorTransform("color"),
  values: "colors"
})

const lightDarkBorderColorUtility = defineUtility({
  group: "Border",
  shorthand: "lightDarkBorderColor",
  transform: createLightDarkColorTransform("borderColor"),
  values: "colors"
})

const lightDarkOutlineColorUtility = defineUtility({
  group: "Other",
  shorthand: "lightDarkOutlineColor",
  transform: createLightDarkColorTransform("outlineColor"),
  values: "colors"
})

export const customUtilities = {
  lightDarkBgUtility,
  lightDarkGradientFromUtility,
  lightDarkGradientToUtility,
  lightDarkBorderColorUtility,
  lightDarkColorUtility,
  lightDarkOutlineColorUtility
}
