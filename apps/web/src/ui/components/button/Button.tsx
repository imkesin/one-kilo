"use client"

import { Button as AriaKitButton } from "@ariakit/react"
import { LoaderCircle } from "lucide-react"
import { type ComponentPropsWithoutRef, forwardRef, type PropsWithChildren } from "react"
import { styled } from "~/generated/styled-system/jsx"
import { gridItem } from "~/generated/styled-system/patterns"
import { button as buttonRecipe, type ButtonVariantProps } from "~/generated/styled-system/recipes"

const StyledButton = styled(AriaKitButton, buttonRecipe)

type AriaKitButtonProps = ComponentPropsWithoutRef<typeof AriaKitButton>
type CustomButtonProps = {
  isLoading?: boolean
  isDisabled?: boolean
}
type ButtonProps = Omit<AriaKitButtonProps, "disabled"> & ButtonVariantProps & CustomButtonProps

function LoadingContainer({ children }: PropsWithChildren) {
  return (
    <>
      <div
        className={gridItem({
          colStart: 1,
          colEnd: -1,
          rowStart: 1,
          rowEnd: -1,
          display: "inline-grid",
          gridAutoFlow: "column",
          gridAutoColumns: "auto",
          opacity: 0
        })}
      >
        {children}
      </div>
      <div
        className={gridItem({
          colStart: 1,
          colEnd: -1,
          rowStart: 1,
          rowEnd: -1,
          justifySelf: "center",
          animation: "spin",
          animationDuration: "1s",
          animationIterationCount: "infinite"
        })}
      >
        <LoaderCircle size={20} />
      </div>
    </>
  )
}

function PassthroughContainer({ children }: PropsWithChildren) {
  return <>{children}</>
}

function useLoadingProps(isLoading?: boolean) {
  if (isLoading) {
    return {
      Container: LoadingContainer,
      loadingProps: {
        disabled: true,
        "data-loading": true
      }
    } as const
  }

  return {
    Container: PassthroughContainer,
    loadingProps: {}
  } as const
}

function useDisabledProps(isDisabled?: boolean) {
  return isDisabled
    ? { disabledProps: { disabled: true } } as const
    : { disabledProps: {} } as const
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ isDisabled, isLoading, children, ...restProps }, ref) {
    const { disabledProps } = useDisabledProps(isDisabled)
    const { Container, loadingProps } = useLoadingProps(isLoading)

    return (
      <StyledButton
        {...restProps}
        {...loadingProps}
        {...disabledProps}
        ref={ref}
      >
        <Container>
          {children}
        </Container>
      </StyledButton>
    )
  }
)
