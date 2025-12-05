type InputTokenDefinition = { light: { value: string }; dark: { value: string } }
type OutputTokenDefinition = InputTokenDefinition & { DEFAULT: { value: string } }

export function withDefaultDark<T extends Record<string, InputTokenDefinition>>(
  tokens: T
): Record<keyof T, OutputTokenDefinition> {
  const transformedTokens = Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [
      key,
      { DEFAULT: value.dark, ...value }
    ])
  )

  return transformedTokens as Record<keyof T, OutputTokenDefinition>
}

type SemanticInputTokenDefinition = `colors.${string}.${string}`
type SemanticOutputTokenDefinition = {
  DEFAULT: { value: `colors.${string}.${string}` }
  light: { value: `colors.${string}.${string}.light` }
  dark: { value: `colors.${string}.${string}.dark` }
}

export function withDefaultDarkOnSemantic<T extends Record<string, SemanticInputTokenDefinition>>(
  tokens: T
): Record<keyof T, SemanticOutputTokenDefinition> {
  const transformedTokens = Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [
      key,
      {
        DEFAULT: { value: `{${value}.dark}` },
        light: { value: `{${value}.light}` },
        dark: { value: `{${value}.dark}` }
      }
    ])
  )

  return transformedTokens as Record<keyof T, SemanticOutputTokenDefinition>
}
