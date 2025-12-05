import { defineRecipe } from "@pandacss/dev"

export const formLabelRecipe = defineRecipe({
  base: {
    lightDarkColor: "grey.text",
    fontSize: "sm",
    fontWeight: "medium"
  },
  className: "form-label",
  jsx: ["FormLabel"],
  defaultVariants: {
    necessity: "optional"
  },
  variants: {
    necessity: {
      optional: {},
      required: {
        _after: {
          paddingLeft: "0.25ch",
          lightDarkColor: "grey.text",
          opacity: 0.9,
          content: "\"*\""
        }
      }
    }
  }
})
