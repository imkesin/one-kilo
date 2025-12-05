import type { ComponentProps } from "react"
import { grid } from "~/generated/styled-system/patterns"
import { FormInput } from "./FormInput"
import { FormLabel } from "./FormLabel"

type FormInputProps = Pick<
  ComponentProps<typeof FormInput>,
  | "autoComplete"
  | "name"
  | "placeholder"
>

type FormTextFieldProps = FormInputProps & {
  label: string
  isRequired?: boolean
}

export function FormTextField({
  label,
  name,
  autoComplete,
  isRequired,
  placeholder
}: FormTextFieldProps) {
  return (
    <div
      className={grid({
        display: "grid",
        gap: "0.5"
      })}
    >
      <FormLabel name={name} necessity={isRequired ? "required" : "optional"}>{label}</FormLabel>
      <FormInput
        name={name}
        type="text"
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={isRequired}
      />
    </div>
  )
}
