import { defineRecipe } from "@pandacss/dev"

export const formInputRecipe = defineRecipe({
  base: {
    _disabled: {
      cursor: "not-allowed",
      opacity: 0.5
    },
    _focusVisible: {
      outlineOffset: "2px",
      outlineStyle: "solid",
      outlineWidth: "2px"
    },
    _placeholder: {
      lightDarkColor: "grey.text",
      opacity: 0.7
    },
    appearance: "none",
    background: "none",
    borderRadius: "sm",
    borderWidth: "2px",
    transitionDuration: "normal",
    transitionProperty: "border-color",
    transitionTimingFunction: "default",

    lightDarkColor: "grey.text.emphasized",

    paddingInline: "2",
    h: "10"
  },
  className: "form-input",
  jsx: ["FormInput"],
  defaultVariants: {
    visual: "accent"
  },
  variants: {
    visual: {
      accent: {
        lightDarkBg: "grey.2",
        lightDarkBorderColor: "grey.border",
        _focusVisible: {
          lightDarkOutlineColor: "accent.emphasized",
          lightDarkBorderColor: "accent.emphasized"
        }
      }
    }
  }
})
