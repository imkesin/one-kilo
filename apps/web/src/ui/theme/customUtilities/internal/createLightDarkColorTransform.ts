import { PropertyConfig } from "@pandacss/dev"

type TransformArgs = Exclude<PropertyConfig["transform"], undefined> extends (value: any, args: infer U) => any
  ? U
  : never

function handleColorMix({
  property,
  token,
  value
}: {
  property: string
  token: TransformArgs["token"]
  value: string
}) {
  const [colorPath, opacityPath] = value.split("/")
  if (!colorPath || !opacityPath) {
    return { [property]: value }
  }
  const colorVariable = token(`colors.${colorPath}`)
  const rawOpacityValue = token.raw(`opacity.${opacityPath}`)?.value as unknown

  if (!colorVariable || typeof rawOpacityValue !== "number") {
    return { [property]: value }
  }

  const lightVariable = token(`colors.${colorPath}.light`)
  const darkVariable = token(`colors.${colorPath}.dark`)

  if (!lightVariable || !darkVariable) {
    return { [property]: value }
  }

  const percent = `${String(rawOpacityValue * 100)}%`
  const lightDark = `light-dark(${lightVariable}, ${darkVariable})`

  return {
    [property]: `color-mix(in srgb, ${lightDark} ${percent}, transparent)`
  }
}

export function createLightDarkColorTransform(property: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any, { raw, token }: TransformArgs) => {
    if (typeof value !== "string" || typeof raw !== "string") {
      return { [property]: value }
    }

    if (value.includes("/")) {
      return handleColorMix({ property, token, value })
    }

    const currentRaw = token.raw(`colors.${raw}`)
    if (!currentRaw) {
      return { [property]: value }
    }

    const lightVariable = token(`colors.${raw}.light`)
    const darkVariable = token(`colors.${raw}.dark`)

    if (!lightVariable || !darkVariable) {
      return { [property]: value }
    }

    return {
      [property]: `light-dark(${lightVariable}, ${darkVariable})`
    }
  }
}
