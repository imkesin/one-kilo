import { defineRecipe } from "@pandacss/dev"

export const buttonRecipe = defineRecipe({
  base: {
    alignItems: "center",
    borderRadius: "sm",
    cursor: "pointer",
    display: "inline-grid",
    gridAutoColumns: "auto",
    gridAutoFlow: "column",
    fontWeight: "medium",
    justifyContent: "center",
    gap: 2,
    outline: "none",
    transitionDuration: "normal",
    transitionProperty: "background, border-color, color, opacity",
    transitionTimingFunction: "default",
    userSelect: "none",
    verticalAlign: "middle",
    whiteSpace: "nowrap",

    h: 10,
    px: 4,

    _disabled: {
      opacity: 0.8,

      _loading: {
        opacity: 0.9
      }
    }
  },
  className: "button",
  jsx: ["Button"],
  defaultVariants: {
    visual: "solid"
  },
  variants: {
    visual: {
      solid: {
        lightDarkBg: "accent",
        lightDarkColor: "accent.fg",

        _hover: {
          lightDarkBg: "accent.emphasized"
        },
        _focusVisible: {
          lightDarkBg: "accent.emphasized",
          lightDarkOutlineColor: "accent.emphasized",
          outlineWidth: "2px",
          outlineStyle: "solid",
          outlineOffset: "2px"
        }
      }
    }
  }
})
